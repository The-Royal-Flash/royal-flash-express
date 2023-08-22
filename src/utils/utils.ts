import { Response } from 'express';

// 윈도우 File Path 변경
export const changePathFormula = (urlPath: string): string => {
	return urlPath.replace(/\\/g, '/');
};

// 예상치 못한 오류 처리
export const unkownErrorHandler = (res: Response, error: unknown) => {
	console.log(`Error: ${error}`);
	return res.status(500).send({
		isSuccess: false,
		message: '예상치 못한 오류가 발생했습니다',
		error: error instanceof Error ? error.message : String(error),
	});
};

// 쿠키 전송 메서드
export const sendTokenHandler = (
	res: Response,
	name: string,
	token: string,
	expire: boolean,
) => {
	if ((process.env.BE_SERVER_MODE as string) === 'dev') {
		expire
			? res.cookie(name, token, {
					secure: false,
					httpOnly: true,
					expires: new Date(0),
			  })
			: res.cookie(name, token, {
					secure: false,
					httpOnly: true,
			  });
	} else {
		expire
			? res.cookie(name, token, {
					sameSite: 'none',
					secure: true,
					httpOnly: true,
					expires: new Date(0),
			  })
			: res.cookie(name, token, {
					sameSite: 'none',
					secure: true,
					httpOnly: true,
			  });
	}
};
