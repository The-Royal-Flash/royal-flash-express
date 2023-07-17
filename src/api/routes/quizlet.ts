import express, { Router } from "express";
import {
  createQuizlet,
  deleteQuizlet,
} from "../controllers/quizlet.controller";
import authTokenMiddleware from "../../middlewares/authTokenMiddleware";

const quizlet: Router = express.Router();

quizlet.route("/create").all(authTokenMiddleware).post(createQuizlet);
quizlet
  .route("/delete/:quizletId")
  .all(authTokenMiddleware)
  .delete(deleteQuizlet);

export default quizlet;
