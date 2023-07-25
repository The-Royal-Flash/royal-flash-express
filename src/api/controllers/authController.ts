import { Request, Response } from "express";
import User from "../../models/User";
import bcrypt from "bcrypt";
import { createAccessToken, createRefreshToken } from "../../utils/createJWT";

/* <-- 회원가입 --> */
export const localRegester = async (req: Request, res: Response) => {
  const { email, name, nickname, password, confirmPassword } = req.body;
  const exists = await User.exists({ $or: [{ email }, { nickname }] });

  try {
    if (password !== confirmPassword) {
      return res.status(400).send({
        isSuccess: false,
        message: "비밀번호 확인 불일치",
      });
    }
    if (exists) {
      return res.status(400).send({
        isSuccess: false,
        message: "이미 사용중인 이메일 또는 닉네임",
      });
    }

    await User.create({
      email,
      name,
      nickname,
      password,
    });

    return res.status(200).send({
      isSuccess: true,
      message: "회원가입 성공",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 이메일 중복확인 --> */
export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const exists = await User.exists({ email });

  try {
    if (exists) {
      return res.status(400).send({
        isSuccess: false,
        message: "이미 사용중인 이메일",
      });
    }
    return res.status(200).send({
      isSuccess: true,
      message: "사용 가능한 이메일",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 닉네임 중복확인 --> */
export const checkNickname = async (req: Request, res: Response) => {
  const { nickname } = req.body;
  const exists = await User.exists({ nickname });

  try {
    if (exists) {
      return res.status(400).send({
        isSuccess: true,
        message: "이미 사용중인 닉네임",
      });
    }
    return res.status(200).send({
      isSuccess: true,
      message: "사용 가능한 닉네임",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 로그인 --> */
export const loginLocal = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  try {
    if (!user) {
      return res.status(403).send({
        isSuccess: false,
        message: "올바른 아이디와 비밀번호를 입력해주세요",
      });
    } else {
      const pass = await bcrypt.compare(password, user.password);
      if (!pass) {
        return res.status(403).send({
          isSuccess: false,
          message: "올바른 아이디와 비밀번호를 입력해주세요",
        });
      }

      // Access Token 발급
      const accessToken = createAccessToken({
        id: user._id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      });

      // Refresh Token 발급
      const refreshToken = createRefreshToken({
        id: user._id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      });

      // Token 전송
      res.cookie("accessToken", accessToken, {
        secure: false, // http: false, https: true
        httpOnly: true,
      });
      res.cookie("refreshToken", refreshToken, {
        secure: false, // http: false, https: true
        httpOnly: true,
      });

      // 로그인 성공 반환
      return res.status(200).send({
        isSuccess: true,
        message: "로그인 성공",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl
        }
      });
    }
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 로그아웃 --> */
export const logout = (req: Request, res: Response) => {
  try {
    const cookieOptions = {
      secure: false, // http: false, https: true
      httpOnly: true,
      expires: new Date(0), // 쿠키 무효화
    };

    res.cookie("accessToken", "", cookieOptions);
    res.cookie("refreshToken", "", cookieOptions);

    return res.status(200).send({
      isSuccess: true,
      message: "로그아웃 성공",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류 발생",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
