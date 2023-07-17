import { Request, Response } from "express";
import User from "../../models/User";
import { createAccessToken, createRefreshToken } from "../../utils/createJWT";
import jwt, { JwtPayload } from "jsonwebtoken";
import { changePathFormula } from "../../utils/utils";
import fs from "fs";
import bcrypt from "bcrypt";

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

    // 업데이트 오류 시
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

    // 업데이트 오류 시
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

/* <-- Avatar 업로드 --> */
export const uploadAvatar = async (req: Request, res: Response) => {
  const file = req.file;

  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "Not Authorized",
      });
    }

    // DB에 변경된 Avatar URL 저장
    const updatedInfo = await User.findByIdAndUpdate(
      user.id,
      { avatarUrl: file ? changePathFormula(file.path) : user.avatarUrl },
      { new: true }
    );

    // 업데이트 오류 시
    if (!updatedInfo) {
      return res.status(400).send({
        isSuccess: false,
        message: "User not found",
      });
    }

    // 기존 업로드된 Avatar 이미지 삭제
    if (user.avatarUrl !== "") {
      fs.unlink(user.avatarUrl, (error) => {
        if (error) {
          return res.status(500).send({
            isSuccess: false,
            message: "Server Error",
          });
        }
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
      avatarUrl: (req as any).user.avatarUrl,
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

/* <-- 비밀번호 변경 --> */
export const editPassword = async (req: Request, res: Response) => {
  const { password, newPassword, newConfirmPassword } = req.body;

  try {
    const { id } = (req as any).user;
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "Not Authorized",
      });
    }

    // 새 비밀번호와 새 비밀번호 확인 불일치일 경우
    if (newPassword !== newConfirmPassword) {
      return res.status(400).send({
        isSuccess: false,
        message: "New password mismatch",
      });
    }

    // DB에서 기존 유저 정보 가져오기
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).send({
        isSuccess: false,
        message: "User not found",
      });
    }

    // 기존 비밀번호 비교
    const pass = await bcrypt.compare(password, user.password);

    // 기존 비밀번호 불일치일 경우
    if (!pass) {
      return res.status(400).send({
        isSuccess: false,
        message: "The wrong password",
      });
    }

    // 비밀번호 저장
    user.password = newPassword;
    await user.save();

    // 정보수정 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "Modify successful",
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
