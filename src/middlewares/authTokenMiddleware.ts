import { Request, Response, NextFunction } from 'express';
import {
	createAccessToken,
	verifyAccessToken,
	verifyRefreshToken,
} from '../utils/jwt-util';
import RefreshToken from '../models/RefreshToken';
import { sendTokenHandler } from '../utils/utils';

const authTokenMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		// 쿠키에 저장된 Token 추출
		const accessToken = req.cookies.accessToken;
		const refreshToken = req.cookies.refreshToken;

		// 쿠키 유효성 검증
		const isAccessToken = verifyAccessToken(accessToken);
		const isRefreshToken = verifyRefreshToken(refreshToken);

		if (!isRefreshToken) {
			return res.status(419).send({
				isSuccess: false,
				message: 'Refresh Token이 만료 또는 유효하지 않습니다',
			});
		} else if (!isAccessToken) {
			const refreshTokenData = await RefreshToken.findOne({
				token: refreshToken,
			}).select('userId');
			if (!refreshTokenData) {
				return res.status(419).send({
					isSuccess: false,
					message: 'Refresh Token이 만료 또는 유효하지 않습니다',
				});
			}

			try {
				const newAccessToken = createAccessToken({
					id: refreshTokenData.userId,
				});

				sendTokenHandler(res, 'accessToken', newAccessToken, false);

				(req as any).user = { id: refreshTokenData.userId };
				next();
			} catch (error) {
				console.log(error);
				res.status(500).send({
					isSuccess: false,
					message: 'Server Error',
				});
			}
		} else {
			(req as any).user = { id: isAccessToken };
			next();
		}
	} catch (error) {
		console.log(error);
		res.status(500).send({
			isSuccess: false,
			message: 'Server Error',
		});
	}
};

export default authTokenMiddleware;
