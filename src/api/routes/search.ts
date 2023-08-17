import express, { Router } from 'express';
import authTokenMiddleware from '../../middlewares/authTokenMiddleware';
import {
	getMyQuizletSearch,
	getOwnedQuizlet,
	getSearch,
} from '../controllers/search.controller';

const search: Router = express.Router();

search.route('/').get(getSearch);
search.route('/myquizlet/').all(authTokenMiddleware).get(getMyQuizletSearch);
search.route('/ownedquizlet/').all(authTokenMiddleware).get(getOwnedQuizlet);

export default search;
