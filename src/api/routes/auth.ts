import express, { Router } from "express";
import {
  checkEmail,
  checkNickname,
  localRegester,
  loginLocal,
  logout,
} from "../controllers/authController";

const auth: Router = express.Router();

auth.route("/register/local").post(localRegester);
auth.route("/register/local/check-email").post(checkEmail);
auth.route("/register/local/check-nickname").post(checkNickname);
auth.route("/login/local").post(loginLocal);
auth.route("/logout").post(logout);

export default auth;
