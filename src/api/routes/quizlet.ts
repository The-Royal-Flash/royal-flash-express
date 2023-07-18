import express, { Router } from "express";
import {
  createQuizlet,
  deleteQuizlet,
  editQuizlet,
} from "../controllers/quizlet.controller";
import authTokenMiddleware from "../../middlewares/authTokenMiddleware";

const quizlet: Router = express.Router();

quizlet.route("/create").all(authTokenMiddleware).post(createQuizlet);
quizlet.route("/edit/:quizletId").all(authTokenMiddleware).post(editQuizlet);
quizlet
  .route("/delete/:quizletId")
  .all(authTokenMiddleware)
  .delete(deleteQuizlet);

export default quizlet;
