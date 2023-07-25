import express, { Router } from "express";
import {
  editName,
  editNickname,
  editPassword,
  getProfile,
  uploadAvatar,
} from "../controllers/profileController";
import uploadAvatarMiddleware, {
  uploadAvatarErrorMiddleware,
} from "../../middlewares/uploadAvatarMiddleware";

const profile: Router = express.Router();

profile.route("/").get(getProfile);
profile.route("/edit/name").post(editName);
profile.route("/edit/nickname").post(editNickname);
profile.route("/edit/password").post(editPassword);
profile
  .route("/edit/avatar")
  .post(uploadAvatarMiddleware.single("image"), uploadAvatar);
profile.use(uploadAvatarErrorMiddleware);

export default profile;