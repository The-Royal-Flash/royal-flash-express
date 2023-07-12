import express, { Router } from "express";
import { checkEmail, checkNickname, localRegester } from "./authController";

const auth: Router = express.Router();

auth.route("/register/local").post(localRegester);
auth.route("/register/local/check-email").get(checkEmail);
auth.route("/register/local/check-nickname").get(checkNickname);

export default auth;
