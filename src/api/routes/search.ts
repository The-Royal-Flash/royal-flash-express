import express, { Router } from "express";
import authTokenMiddleware from "../../middlewares/authTokenMiddleware";
import { getMyQuizletSearch, getSearch } from "../controllers/searchController";

const search: Router = express.Router();

search.route("/").get(getSearch);
search.route("/myquizlet/").all(authTokenMiddleware).get(getMyQuizletSearch);

export default search;