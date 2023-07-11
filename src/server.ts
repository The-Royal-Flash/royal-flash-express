import express, { Express, Request, Response } from "express";
import { json } from "body-parser";
import apiRouter from "./routes/apiRouter";

const app: Express = express();

app.use(json());

app.use("/api", apiRouter);

app.get("*", (req: Request, res: Response) => {
  res.send("Express with Typescript!");
});

export default app;
