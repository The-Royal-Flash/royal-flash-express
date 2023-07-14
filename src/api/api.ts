import express, { Router } from "express";
import auth from "./routes/auth";

const api: Router = express.Router();

api.use("/auth", auth);

export default api;
