import express, { Router } from 'express';
import { getSearch } from '../controllers/searchController';

const search: Router = express.Router();

search.route('/').get(getSearch);

export default search;