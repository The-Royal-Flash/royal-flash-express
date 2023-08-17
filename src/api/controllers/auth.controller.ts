import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/User';
import { createAccessToken, createRefreshToken } from '../../utils/jwt-util';
import RefreshToken from '../../models/RefreshToken';

/* <-- 회원가입 --> */
export const localRegester = async (req: Request, res: Response) => {
	try {
		const { email, name, nickname, password, confirmPassword } = req.body;
		const exists = await User.exists({ $or: [{ email }, { nickname }] });

		if (password !== confirmPassword) {
			return res.status(400).send({
				isSuccess: false,
				message: '비밀번호 확인이 일치하지 않습니다',
			});
		}
		if (exists) {
			return res.status(400).send({
				isSuccess: false,
				message: '이미 사용중인 이메일 또는 닉네임입니다',
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
			message: '성공적으로 가입이 완료되었습니다',
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(500).send({
			isSuccess: false,
			message: '예상치 못한 오류가 발생했습니다',
			error: error instanceof Error ? error.message : String(error),
		});
	}
};

/* <-- 이메일 중복확인 --> */
export const checkEmail = async (req: Request, res: Response) => {
	try {
		const { email } = req.body;

		const exists = await User.exists({ email });
		if (exists) {
			return res.status(400).send({
				isSuccess: false,
				message: '이미 사용중인 이메일입니다',
			});
		}

		return res.status(200).send({
			isSuccess: true,
			message: '사용 가능한 이메일입니다',
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(500).send({
			isSuccess: false,
			message: '예상치 못한 오류가 발생했습니다',
			error: error instanceof Error ? error.message : String(error),
		});
	}
};

/* <-- 닉네임 중복확인 --> */
export const checkNickname = async (req: Request, res: Response) => {
	try {
		const { nickname } = req.body;

		const exists = await User.exists({ nickname });
		if (exists) {
			return res.status(400).send({
				isSuccess: true,
				message: '이미 사용중인 닉네임입니다',
			});
		}

		return res.status(200).send({
			isSuccess: true,
			message: '사용 가능한 닉네임입니다',
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(500).send({
			isSuccess: false,
			message: '예상치 못한 오류기 발생했습니다',
			error: error instanceof Error ? error.message : String(error),
		});
	}
};

/* <-- 로그인 --> */
export const loginLocal = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		console.log(email, password);

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(403).send({
				isSuccess: false,
				message: '올바른 아이디와 비밀번호를 입력해주세요',
			});
		}
		const pass = await bcrypt.compare(password, user.password);
		if (!pass) {
			return res.status(403).send({
				isSuccess: false,
				message: '올바른 아이디와 비밀번호를 입력해주세요',
			});
		}

		// Access Token 발급
		const accessToken = createAccessToken({
			id: user._id,
		});
		// Refresh Token 발급
		const refreshToken = createRefreshToken();

		// DB에 Refresh Token 존재 여부 확인 후 저장
		const isRefreshToken = await RefreshToken.exists({ userId: user._id });
		if (!isRefreshToken) {
			await RefreshToken.create({
				userId: user._id,
				token: refreshToken,
			});
		} else {
			await RefreshToken.findOneAndUpdate(
				{ userId: user._id },
				{
					token: refreshToken,
					createdAt: Date.now(),
				},
			);
		}

		// Token 전송
		res.cookie('accessToken', accessToken, {
			sameSite: 'none',
			secure: true, // http: false, https: true
			httpOnly: true,
		});
		res.cookie('refreshToken', refreshToken, {
			sameSite: 'none',
			secure: true, // http: false, https: true
			httpOnly: true,
		});

		// 성공 여부 반환
		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 로그인 했습니다',
			user: {
				id: user._id,
				email: user.email,
				nickname: user.nickname,
				name: user.name,
				avatarUrl: user.avatarUrl,
			},
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(500).send({
			isSuccess: false,
			message: '예상치 못한 오류가 발생했습니다',
			error: error instanceof Error ? error.message : String(error),
		});
	}
};

/* <-- 로그아웃 --> */
export const logout = (req: Request, res: Response) => {
	try {
		res.cookie('accessToken', '', {
			sameSite: 'none',
			secure: true, // http: false, https: true
			httpOnly: true,
			expires: new Date(0), // 쿠키 무효화
		});
		res.cookie('refreshToken', '', {
			sameSite: 'none',
			secure: true, // http: false, https: true
			httpOnly: true,
			expires: new Date(0), // 쿠키 무효화
		});

		return res.status(200).send({
			isSuccess: true,
			message: '성공적으로 로그아웃 했습니다',
		});
	} catch (error) {
		console.log(`Error: ${error}`);
		return res.status(500).send({
			isSuccess: false,
			message: '예상치 못한 오류가 발생했습니다',
			error: error instanceof Error ? error.message : String(error),
		});
	}
};
