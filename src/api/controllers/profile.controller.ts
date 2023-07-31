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
    // 로그인 여부 확인
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    const { id } = (req as any).user;

    // 사용자 정보 조회
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).send({
        isSuccess: false,
        message: "사용자 정보를 찾을 수 없습니다",
      });
    }

    const { _id, email, name, nickname, avatarUrl } = user;

    // 성공 여부 반환
    return res.status(200).send({
      isSuccess: true,
      user: {
        _id,
        email,
        name,
        nickname,
        avatarUrl,
      },
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 이름 변경 --> */
export const editName = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // 로그인 여부 확인
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능",
      });
    }

    const { id } = (req as any).user;

    // DB에 변경된 이름 저장
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(400).send({
        isSuccess: false,
        message: "사용자를 찾을 수 없거나 정보 업데이트시 오류가 발생했습니다",
      });
    }

    // Access Token 재발행
    const accessToken = createAccessToken({
      id: updatedUser._id,
    });

    // Refresh Token 재발행
    const refreshToken = createRefreshToken({
      id: updatedUser._id,
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

    // 성공 여부 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 사용자 이름을 변경했습니다",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 닉네임 변경 --> */
export const editNickname = async (req: Request, res: Response) => {
  try {
    const { nickname } = req.body;

    // 로그인 여부 확인
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    const { id } = (req as any).user;

    // 닉네임 중복 확인
    const isNickname = await User.exists({ nickname });
    if (isNickname) {
      return res.status(400).send({
        isSuccess: false,
        message: "이미 사용중인 닉네임 입니다",
      });
    }

    // DB에 변경된 닉네임 저장
    const updatedInfo = await User.findByIdAndUpdate(
      id,
      { nickname },
      { new: true }
    );
    if (!updatedInfo) {
      return res.status(400).send({
        isSuccess: false,
        message: "사용자를 찾을 수 없거나 정보 업데이트시 오류가 발생했습니다",
      });
    }

    // 성공 여부 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 닉네임을 변경했습니다",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- Avatar 업로드 --> */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const image = req.file;

    // 로그인 여부 확인
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    const { id } = (req as any).user;

    // 사용자 정보 조회
    const user = await User.findById(id);
    if(!user) {
      return res.status(404).send({
        isSuccess: false,
        message: '사용자 정보를 찾을 수 없습니다'
      });
    }

    // DB에 변경된 Avatar URL 저장
    const updatedInfo = await User.findByIdAndUpdate(
      user._id,
      { avatarUrl: image ? changePathFormula(image.path) : user.avatarUrl },
      { new: true }
    );

    // 업데이트 오류 시
    if (!updatedInfo) {
      return res.status(400).send({
        isSuccess: false,
        message: "사용자를 찾을 수 없거나 정보 업데이트시 오류가 발생했습니다",
      });
    }

    // 기존 업로드된 Avatar 이미지 삭제
    if (user.avatarUrl !== "") {
      fs.unlink(user.avatarUrl, (error) => {
        if (error) {
          return res.status(500).send({
            isSuccess: false,
            message: "업로드시 서버에러가 발생했습니다",
          });
        }
      });
    }

    // 정보수정 성공 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 아바타를 변경했습니다",
      avatarUrl: (req as any).user.avatarUrl,
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/* <-- 비밀번호 변경 --> */
export const editPassword = async (req: Request, res: Response) => {
  try {
    const { password, newPassword, newConfirmPassword } = req.body;

    // 로그인 여부 확인
    if (!(req as any).user) {
      return res.status(401).send({
        isSuccess: false,
        message: "로그인된 사용자만 접근 가능합니다",
      });
    }

    const { id } = (req as any).user;

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
      return res.status(404).send({
        isSuccess: false,
        message: "사용자 정보를 찾을 수 없습니다",
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

    // 성공 여부 반환
    return res.status(200).send({
      isSuccess: true,
      message: "성공적으로 비밀번호를 변경했습니다",
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    return res.status(500).send({
      isSuccess: false,
      message: "예상치 못한 오류가 발생했습니다",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};