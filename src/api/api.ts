import express, { Router } from "express";
import auth from "./auth/auth";

const api: Router = express.Router();

api.use("/auth", auth);

export default api;
