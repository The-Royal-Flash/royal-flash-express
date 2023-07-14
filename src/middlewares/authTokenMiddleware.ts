import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";

const authTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 쿠키에 저장된 AccessToken 추출
    const accessToken = req.cookies.accessToken;

    // AccessToken이 없는 경우
    if (!accessToken) {
      return res.status(401).send({
        isSuccess: false,
        message: "Access token not found",
      });
    }

    // AccessToken 검증
    jwt.verify(
      accessToken,
      process.env.ACCESS_SECRET as string,
      { complete: true },
      (error: jwt.VerifyErrors | null, decoded: any) => {
        if (error) {
          // 만료된 AccessToken인 경우
          if (error instanceof TokenExpiredError) {
            // 쿠키에 저장된 RefreshToken 추출
            const refreshToken = req.cookies.refreshToken;

            // RefreshToken이 없는 경우
            if (!refreshToken) {
              return res.status(401).send({
                isSuccess: false,
                message: "Refresh token not found",
              });
            }

            // RefreshToken 검증
            jwt.verify(
              refreshToken,
              process.env.REFRESH_SECRET as string,
              (error: jwt.VerifyErrors | null, user: any) => {
                // Refresh Token이 유요하지 않은 경우
                if (error) {
                  return res.status(403).send({
                    isSuccess: false,
                    message: "Invalid refresh token",
                  });
                }
              }
            );

            // Refresh Token이 유요한 경우, 새로운 AccessToken 발급
            const newAccessToken = jwt.sign(
              decoded.payload,
              process.env.ACCESS_SECRET as string,
              {
                expiresIn: "30m",
                issuer: "Royal Flash",
              }
            );

            // 갱신된 AccessToken을 쿠키에 설정
            res.cookie("accessToken", newAccessToken, {
              secure: false, // http: false, https: true
              httpOnly: true,
            });

            // Request 객체에 사용자 정보 추가
            (req as any).user = decoded.payload;

            next();
          }
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send({
      isSuccess: false,
      message: "Server Error",
    });
  }
};

export default authTokenMiddleware;
