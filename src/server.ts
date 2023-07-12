import express, { Express, Request, Response } from "express";
import api from "./api/api";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", api);

export default app;
