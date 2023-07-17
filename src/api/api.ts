import express, { Router } from "express";
import auth from "./routes/auth";
import profile from "./routes/profile";
import authTokenMiddleware from "../middlewares/authTokenMiddleware";
import quizlet from "./routes/quizlet";

const api: Router = express.Router();

api.use("/auth", auth);
api.use("/profile", authTokenMiddleware, profile);
api.use("/quizlet", quizlet);

export default api;
