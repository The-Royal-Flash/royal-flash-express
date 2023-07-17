import express, { Router } from "express";
import { createQuizlet } from "../controllers/quizlet.controller";
import authTokenMiddleware from "../../middlewares/authTokenMiddleware";

const quizlet: Router = express.Router();

quizlet.route("/create").all(authTokenMiddleware).post(createQuizlet);

export default quizlet;
