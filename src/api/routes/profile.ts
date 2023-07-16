import express, { Router } from "express";
import {
  editName,
  editNickname,
  getProfile,
  uploadAvatar,
} from "../controllers/profileController";
import uploadAvatarMiddleware from "../../middlewares/uploadAvatarMiddleware";

const profile: Router = express.Router();

profile.route("/").get(getProfile);
profile.route("/edit/name").post(editName);
profile.route("/edit/nickname").post(editNickname);
profile
  .route("/edit/avatar")
  .post(uploadAvatarMiddleware.single("file"), uploadAvatar);

export default profile;
