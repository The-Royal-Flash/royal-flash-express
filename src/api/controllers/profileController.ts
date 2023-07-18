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
        message: "로그인된 사용자만 접근 가능",
      });
    }

    const info = await User.findOne({ _id: user.id });
    if (!info) {
      return res.status(404).send({
        isSuccess: false,
        message: "사용자 정보를 찾을 수 없습니다",
      });
    }
    return res.status(200).send({
      isSuccess: true,
      user: info,
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

/* <-- 이름 변경 --> */
export const editName = async (req: Request, res: Response) => {
  const { name } = req.body;

  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능",
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
        message: "사용자를 찾을 수 없거나 정보 업데이트시 오류 발생",
      });
    }

    // Access Token 재발행
    const accessToken = createAccessToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
    });

    // Refresh Token 재발행
    const refreshToken = createRefreshToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
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
      message: "이름 변경 성공",
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

/* <-- 닉네임 변경 --> */
export const editNickname = async (req: Request, res: Response) => {
  const { nickname } = req.body;

  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능",
      });
    }

    // 닉네임 중복 확인
    const isNickname = await User.exists({ nickname });
    if (isNickname) {
      return res.status(400).send({
        isSuccess: false,
        message: "이미 사용중인 닉네임",
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
        message: "사용자를 찾을 수 없거나 정보 업데이트시 오류 발생",
      });
    }

    // Access Token 재발행
    const accessToken = createAccessToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
    });

    // Refresh Token 재발행
    const refreshToken = createRefreshToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
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
      message: "닉네임 변경 성공",
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

/* <-- Avatar 업로드 --> */
export const uploadAvatar = async (req: Request, res: Response) => {
  const file = req.file;

  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능",
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
        message: "사용자를 찾을 수 없거나 정보 업데이트시 오류 발생",
      });
    }

    // 기존 업로드된 Avatar 이미지 삭제
    if (user.avatarUrl !== "") {
      fs.unlink(user.avatarUrl, (error) => {
        if (error) {
          return res.status(500).send({
            isSuccess: false,
            message: "서버 처리 에러",
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
    });

    // Refresh Token 재발행
    const refreshToken = createRefreshToken({
      id: updatedInfo._id,
      email: updatedInfo.email,
      name: updatedInfo.name,
      nickname: updatedInfo.nickname,
      avatarUrl: updatedInfo.avatarUrl,
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
      message: "아바타 변경 성공",
      avatarUrl: (req as any).user.avatarUrl,
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

/* <-- 비밀번호 변경 --> */
export const editPassword = async (req: Request, res: Response) => {
  const { password, newPassword, newConfirmPassword } = req.body;

  try {
    const { id } = (req as any).user;
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능",
      });
    }

    // 새 비밀번호와 새 비밀번호 확인 불일치일 경우
    if (newPassword !== newConfirmPassword) {
      return res.status(400).send({
        isSuccess: false,
        message: "새 비밀번호 확인 불일치",
      });
    }

    // DB에서 기존 유저 정보 가져오기
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).send({
        isSuccess: false,
        message: "사용자를 찾을 수 없습니다",
      });
    }

    // 기존 비밀번호 비교
    const pass = await bcrypt.compare(password, user.password);

    // 기존 비밀번호 불일치일 경우
    if (!pass) {
      return res.status(400).send({
        isSuccess: false,
        message: "현재 비밀번호를 잘못 입력하셨습니다",
      });
    }

    // 비밀번호 저장
    user.password = newPassword;
    await user.save();

    // 정보수정 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "비밀번호 변경 성공",
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
