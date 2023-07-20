import express, { Router } from "express";
import {
  createQuizlet,
  deleteQuizlet,
  quizletInfo,
  editQuizlet,
  quizletDetail,
  allTagList,
  myTagList,
} from "../controllers/quizletController";
import authTokenMiddleware from "../../middlewares/authTokenMiddleware";

const quizlet: Router = express.Router();

quizlet.route("/create").all(authTokenMiddleware).post(createQuizlet);
quizlet.route("/info/:quizletId([0-9a-f]{24})").get(quizletInfo);
quizlet.route("/detail/:quizletId([0-9a-f]{24})").get(quizletDetail);
quizlet
  .route("/edit/:quizletId([0-9a-f]{24})")
  .all(authTokenMiddleware)
  .post(editQuizlet);
quizlet
  .route("/delete/:quizletId([0-9a-f]{24})")
  .all(authTokenMiddleware)
  .delete(deleteQuizlet);
quizlet.route("/tag").get(allTagList);
quizlet.route("/tag/mine").all(authTokenMiddleware).get(myTagList);

export default quizlet;
