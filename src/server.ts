import express, { Express, Request, Response } from "express";
import api from "./api/api";
import cookieParser from "cookie-parser";
import cors from "cors";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use("/api", api);

export default app;
