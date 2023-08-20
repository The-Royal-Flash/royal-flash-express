import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/User';
import { uploadAvatarToS3 } from '../../middlewares/uploadAvatarMiddleware';
import storage from '../../s3/s3.config';
import { unkownErrorHandler } from '../../utils/utils';

/* <-- Profile 정보 --> */
export const getProfile = async (req: Request, res: Response) => {
	try {
		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 사용자 정보 조회
		const user = await User.findOne({ _id: id });
		if (!user) {
			return res.status(404).send({
				isSuccess: false,
				message: '사용자 정보를 찾을 수 없습니다',
			});
		}

		const { _id, email, name, nickname, avatarUrl } = user;

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			user: {
				id: _id,
				email,
				name,
				nickname,
				avatarUrl,
			},
		});
	} catch (error) {
		unkownErrorHandler(res, error);
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
				message: '로그인된 사용자만 접근 가능',
			});
		}

		const { id } = (req as any).user;

		// DB에 변경된 이름 저장
		const updatedUser = await User.findByIdAndUpdate(
			id,
			{ name },
			{ new: true },
		);
		if (!updatedUser) {
			return res.status(400).send({
				isSuccess: false,
				message: '사용자를 찾을 수 없거나 정보 업데이트시 오류가 발생했습니다',
			});
		}

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 사용자 이름을 변경했습니다',
		});
	} catch (error) {
		unkownErrorHandler(res, error);
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
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 닉네임 중복 확인
		const isNickname = await User.exists({ nickname });
		if (isNickname) {
			return res.status(400).send({
				isSuccess: false,
				message: '이미 사용중인 닉네임 입니다',
			});
		}

		// DB에 변경된 닉네임 저장
		const updatedInfo = await User.findByIdAndUpdate(
			id,
			{ nickname },
			{ new: true },
		);
		if (!updatedInfo) {
			return res.status(400).send({
				isSuccess: false,
				message: '사용자를 찾을 수 없거나 정보 업데이트시 오류가 발생했습니다',
			});
		}

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 닉네임을 변경했습니다',
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};

/* <-- Avatar 업로드 --> */
export const uploadAvatar = async (req: Request, res: Response) => {
	try {
		// 로그인 여부 확인
		if (!(req as any).user) {
			return res.status(401).send({
				isSuccess: false,
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		// 아바타 이미지 확인
		if (!req.file) {
			return res.status(404).send({
				isSuccess: false,
				message: '아바타 이미지를 찾을 수 없습니다',
			});
		}

		const image = req.file;
		const { id } = (req as any).user;

		// 사용자 정보 조회
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).send({
				isSuccess: false,
				message: '사용자 정보를 찾을 수 없습니다',
			});
		}

		// 아바타 이미지 업로드
		const avatarUrl = await uploadAvatarToS3(image);

		// DB에 변경된 Avatar URL 저장
		const updatedInfo = await User.findByIdAndUpdate(
			user._id,
			{ avatarUrl },
			{ new: true },
		);

		// 업데이트 오류 시
		if (!updatedInfo) {
			return res.status(400).send({
				isSuccess: false,
				message: '사용자를 찾을 수 없거나 정보 업데이트시 오류가 발생했습니다',
			});
		}

		// 기존 업로드된 Avatar 이미지 삭제
		if (user.avatarUrl !== '') {
			const regex = /\/([^/]+)$/;
			const prevAvatarPath = (user.avatarUrl as any).match(regex)[1];
			const removeAvatar = {
				Bucket: process.env.S3_BUCKET_NAME as string,
				Key: prevAvatarPath,
			};
			await storage.deleteObject(removeAvatar, function (error: Error) {
				if (error) {
					console.log(error);
				}
			});
		}

		// 정보수정 성공 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 아바타를 변경했습니다',
			avatarUrl: (req as any).user.avatarUrl,
		});
	} catch (error) {
		unkownErrorHandler(res, error);
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
				message: '로그인된 사용자만 접근 가능합니다',
			});
		}

		const { id } = (req as any).user;

		// 새 비밀번호와 새 비밀번호 확인 불일치일 경우
		if (newPassword !== newConfirmPassword) {
			return res.status(400).send({
				isSuccess: false,
				message: '새 비밀번호 확인 불일치',
			});
		}

		// DB에서 기존 유저 정보 가져오기
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).send({
				isSuccess: false,
				message: '사용자 정보를 찾을 수 없습니다',
			});
		}

		// 기존 비밀번호 비교
		const pass = await bcrypt.compare(password, user.password);

		// 기존 비밀번호 불일치일 경우
		if (!pass) {
			return res.status(400).send({
				isSuccess: false,
				message: '현재 비밀번호를 잘못 입력하셨습니다',
			});
		}

		// 비밀번호 저장
		user.password = newPassword;
		await user.save();

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 비밀번호를 변경했습니다',
		});
	} catch (error) {
		unkownErrorHandler(res, error);
	}
};
