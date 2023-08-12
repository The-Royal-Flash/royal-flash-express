import path from 'path';
import multer from 'multer';
import { Request } from 'express';

const multerConfig = {
	storage: multer.diskStorage({
		filename(req, file, callback) {
			callback(null, file.originalname);
		},
	}),
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB 제한
	},
	fileFilter(req: Request, file: Express.Multer.File, callback: any) {
		const allowedFileTypes = /jpeg|jpg|png|gif/; // 허용하는 이미지 파일 형식
		const extname = allowedFileTypes.test(
			path.extname(file.originalname).toLowerCase(),
		);
		const mimetype = allowedFileTypes.test(file.mimetype);

		if (extname && mimetype) {
			callback(null, true);
		} else {
			callback(new Error('이미지 파일만 업로드할 수 있습니다.'));
		}
	},
};

export default multerConfig;
