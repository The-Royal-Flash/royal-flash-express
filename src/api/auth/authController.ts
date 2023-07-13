import { Request, Response } from "express";
import User from "../../models/User";

// 회원가입
export const localRegester = async (req: Request, res: Response) => {
  const { email, name, nickname, password, confirmPassword } = req.body;
  const exists = await User.exists({ $or: [{ email }, { nickname }] });

  try {
    if (password !== confirmPassword) {
      throw new Error("비밀번호가 일치하지 않습니다.");
    }
    if (exists) {
      throw new Error("중복된 이메일 또는 닉네임 입니다.");
    }

    await User.create({
      email,
      name,
      nickname,
      password,
    });

    return res.status(200).send({
      isSuccess: true,
      message: "회원가입이 완료되었습니다.",
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

// 이메일 중복확인
export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const exists = await User.exists({ email });

  try {
    if (exists) {
      throw new Error("중복된 이메일 입니다.");
    }
    return res.status(200).send({
      isSuccess: true,
      message: "사용 가능한 이메일 입니다.",
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

// 닉네임 중복확인
export const checkNickname = async (req: Request, res: Response) => {
  const { nickname } = req.body;
  const exists = await User.exists({ nickname });

  try {
    if (exists) {
      throw new Error("중복된 닉네임 입니다.");
    }
    return res.status(200).send({
      isSuccess: true,
      message: "사용 가능한 닉네임 입니다.",
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
