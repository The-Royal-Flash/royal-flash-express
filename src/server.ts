import express, { Express, Request, Response } from "express";
import api from "./api/api";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", api);

export default app;
