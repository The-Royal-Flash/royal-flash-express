import multer from "multer";

const uploadAvatarMiddleware = multer({
  dest: "uploads/avatars",
  limits: {
    fileSize: 3 * 1024 * 1024, // 이미지 크기 3MB 제한
  },
});

export default uploadAvatarMiddleware;
