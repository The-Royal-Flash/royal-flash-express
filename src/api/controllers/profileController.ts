import { Request, Response } from "express";
import User from "../../models/User";
import { createAccessToken, createRefreshToken } from "../../utils/createJWT";
import jwt, { JwtPayload } from "jsonwebtoken";

/* <-- Profile 정보 --> */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "Not Authorized",
      });
    }

    const info = await User.findById(user.id);
    if (!info) {
      return res.status(400).send({
        isSuccess: false,
        message: "User not found",
      });
    }
    return res.status(200).send({
      isSuccess: true,
      info,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(500).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};

/* <-- 이름 수정 --> */
export const editName = async (req: Request, res: Response) => {
  const { name } = req.body;

  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "Not Authorized",
      });
    }

    // DB에 변경된 이름 저장
    const updatedInfo = await User.findByIdAndUpdate(
      user.id,
      { name },
      { new: true }
    );

    if (!updatedInfo) {
      return res.status(400).send({
        isSuccess: false,
        message: "User not found",
      });
    }

    // Access Token 재발행
    const accessToken = createAccessToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
      // studyLog: user.studyLog,
    });

    // Refresh Token 재발행
    const refreshToken = createRefreshToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
      // studyLog: user.studyLog,
    });

    // Token 재전송
    res.cookie("accessToken", accessToken, {
      secure: false, // http: false, https: true
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      secure: false, // http: false, https: true
      httpOnly: true,
    });

    // Update된 사용자 정보로 req.user 수정
    (req as any).user = jwt.decode(accessToken) as JwtPayload;

    // 정보수정 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "Modify Successful",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(500).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};

/* <-- 닉네임 수정 --> */
export const editNickname = async (req: Request, res: Response) => {
  const { nickname } = req.body;

  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "Not Authorized",
      });
    }

    // 닉네임 중복 확인
    const isNickname = await User.findOne({ nickname });
    if (isNickname) {
      return res.status(400).send({
        isSuccess: false,
        message: "Duplicate Nickname",
      });
    }

    // DB에 변경된 이름 저장
    const updatedInfo = await User.findByIdAndUpdate(
      user.id,
      { nickname },
      { new: true }
    );

    if (!updatedInfo) {
      return res.status(400).send({
        isSuccess: false,
        message: "User not found",
      });
    }

    // Access Token 재발행
    const accessToken = createAccessToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
      // studyLog: user.studyLog,
    });

    // Refresh Token 재발행
    const refreshToken = createRefreshToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
      // studyLog: user.studyLog,
    });

    // Token 재전송
    res.cookie("accessToken", accessToken, {
      secure: false, // http: false, https: true
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      secure: false, // http: false, https: true
      httpOnly: true,
    });

    // Update된 사용자 정보로 req.user 수정
    (req as any).user = jwt.decode(accessToken) as JwtPayload;

    // 정보수정 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "Modify Successful",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(500).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};
