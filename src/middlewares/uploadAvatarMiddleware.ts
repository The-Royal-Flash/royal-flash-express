import { Request, Response, NextFunction } from "express";
import multer from "multer";

// 아바타 업로드 Middleware
const uploadAvatarMiddleware = multer({
  dest: "uploads/avatars",
  limits: {
    fileSize: 3 * 1024 * 1024, // 이미지 크기 3MB 제한
  },
});

// 아바타 업로드 에러처리 Middleware
export const uploadAvatarErrorMiddleware = (
  err: any,
  req: Request,
  res: Response
) => {
  if (err instanceof multer.MulterError) {
    // Multer 에러 인경우
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).send({
        isSuccess: false,
        message: "File size limit exceeded",
      });
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).send({
        isSuccess: false,
        message: "File field name error",
      });
    } else {
      res.status(400).send({
        isSuccess: false,
        message: `Multer error: ${err.message}`,
      });
    }
  }
};

export default uploadAvatarMiddleware;
