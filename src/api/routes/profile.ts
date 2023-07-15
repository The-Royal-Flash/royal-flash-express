import express, { Router } from "express";
import {
  editName,
  editNickname,
  getProfile,
} from "../controllers/profileController";

const profile: Router = express.Router();

profile.route("/").get(getProfile);
profile.route("/edit/name").post(editName);
profile.route("/edit/nickname").post(editNickname);

export default profile;
