import express, { Router } from "express";
import auth from "./routes/auth";
import profile from "./routes/profile";
import authTokenMiddleware from "../middlewares/authTokenMiddleware";

const api: Router = express.Router();

api.use("/auth", auth);
api.use("/profile", authTokenMiddleware, profile);

export default api;
