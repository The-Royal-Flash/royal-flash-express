import express, { Router } from "express";
import {
  createQuizlet,
  deleteQuizlet,
  detailQuizlet,
  editQuizlet,
} from "../controllers/quizlet.controller";
import authTokenMiddleware from "../../middlewares/authTokenMiddleware";

const quizlet: Router = express.Router();

quizlet.route("/create").all(authTokenMiddleware).post(createQuizlet);
quizlet.route("/detail/:quizletId([0-9a-f]{24})").get(detailQuizlet);
quizlet
  .route("/edit/:quizletId([0-9a-f]{24})")
  .all(authTokenMiddleware)
  .post(editQuizlet);
quizlet
  .route("/delete/:quizletId([0-9a-f]{24})")
  .all(authTokenMiddleware)
  .delete(deleteQuizlet);

export default quizlet;
