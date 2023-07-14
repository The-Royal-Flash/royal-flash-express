import express, { Router } from "express";
import {
  accesstoken,
  checkEmail,
  checkNickname,
  localRegester,
  loginLocal,
  loginSuccess,
  logout,
  refreshtoken,
} from "./authController";

const auth: Router = express.Router();

auth.route("/register/local").post(localRegester);
auth.route("/register/local/check-email").get(checkEmail);
auth.route("/register/local/check-nickname").get(checkNickname);
auth.route("/login/local").post(loginLocal);
auth.route("/login/success").get(loginSuccess);
auth.route("/accesstoken").get(accesstoken);
auth.route("/refreshtoken").get(refreshtoken);
auth.route("/logout").post(logout);

export default auth;
