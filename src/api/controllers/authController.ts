import { NextFunction, Request, Response } from "express";
import User from "../../models/User";
import bcrypt from "bcrypt";
import { createAccessToken, createRefreshToken } from "../../utils/createJWT";

/* <-- 회원가입 --> */
export const localRegester = async (req: Request, res: Response) => {
  const { email, name, nickname, password, confirmPassword } = req.body;
  const exists = await User.exists({ $or: [{ email }, { nickname }] });

  try {
    if (password !== confirmPassword) {
      throw new Error("Password mismatch");
    }
    if (exists) {
      throw new Error("Duplicate email or nickname");
    }

    await User.create({
      email,
      name,
      nickname,
      password,
    });

    return res.status(200).send({
      isSuccess: true,
      message: "Sign-up Successful",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(400).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};

/* <-- 이메일 중복확인 --> */
export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const exists = await User.exists({ email });

  try {
    if (exists) {
      throw new Error("Duplicate Email");
    }
    return res.status(200).send({
      isSuccess: true,
      message: "Available Email",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(400).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};

/* <-- 닉네임 중복확인 --> */
export const checkNickname = async (req: Request, res: Response) => {
  const { nickname } = req.body;
  const exists = await User.exists({ nickname });

  try {
    if (exists) {
      throw new Error("Duplicate Nickname");
    }
    return res.status(200).send({
      isSuccess: true,
      message: "Available Nickname",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(400).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};

/* <-- 로그인 --> */
export const loginLocal = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  try {
    if (!user) {
      throw new Error("Email is not queried");
    } else {
      const pass = await bcrypt.compare(password, user.password);
      if (!pass) {
        throw new Error("Email or password is invalid");
      }

      // Access Token 발급
      const accessToken = createAccessToken({
        id: user._id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        // studyLog: user.studyLog,
      });

      // Refresh Token 발급
      const refreshToken = createRefreshToken({
        id: user._id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        // studyLog: user.studyLog,
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
      res.status(200).json({
        isSuccess: true,
        message: "Sign-in Successful",
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      return res.status(403).send({
        isSuccess: false,
        message: error.message,
      });
    } else {
      return res.status(403).send({
        isSuccess: false,
        message: String(error),
      });
    }
  }
};

/* <-- 로그아웃 --> */
export const logout = (req: Request, res: Response) => {
  try {
    req.cookies("accessToken", "");

    return res.status(200).send({
      isSuccess: true,
      message: "Logout Successful",
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
