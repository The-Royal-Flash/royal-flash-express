import fs from 'fs';
import { Request, Response } from 'express';
import multer from 'multer';
import storage from '../s3/s3.config';
import multerConfig from '../s3/multer.config';
import path from 'path';

const uploadAvatarToS3 = async (file: Express.Multer.File) => {
	try {
		const fileContent = fs.readFileSync(file.path);
		const extname = path.extname(file.originalname).toLowerCase();
		let mimeType = '';

		if (extname === '.jpg') {
			mimeType = 'image/jpeg';
		} else if (extname === '.jpeg') {
			mimeType = 'image/jpeg';
		} else if (extname === '.png') {
			mimeType = 'image/png';
		} else if (extname === '.gif') {
			mimeType = 'image/gif';
		}

		console.log(mimeType);

		const params = {
			Bucket: process.env.S3_BUCKET_NAME as string,
			Key: file.originalname as string,
			Body: fileContent,
			acl: 'public-read',
			ContentType: mimeType,
		};

		const result = await storage.upload(params).promise();

		const avatarUrl = `${result.Location}`;

		return avatarUrl;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

// 아바타 업로드 Middleware
const uploadAvatarMiddleware = multer(multerConfig);

// 아바타 업로드 에러처리 Middleware
const uploadAvatarErrorMiddleware = (err: any, req: Request, res: Response) => {
	if (err instanceof multer.MulterError) {
		// Multer 에러 인경우
		if (err.code === 'LIMIT_FILE_SIZE') {
			res.status(400).send({
				isSuccess: false,
				message: 'File size limit exceeded',
			});
		} else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
			res.status(400).send({
				isSuccess: false,
				message: 'File field name error',
			});
		} else {
			res.status(400).send({
				isSuccess: false,
				message: `Multer error: ${err.message}`,
			});
		}
	}
};

export {
	uploadAvatarToS3,
	uploadAvatarErrorMiddleware,
	uploadAvatarMiddleware,
};
