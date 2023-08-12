import express, { Router } from 'express';
import auth from './routes/auth';
import profile from './routes/profile';
import authTokenMiddleware from '../middlewares/authTokenMiddleware';
import quizlet from './routes/quizlet';
import search from './routes/search';

const api: Router = express.Router();

api.use('/auth', auth);
api.use('/profile', authTokenMiddleware, profile);
api.use('/quizlet', quizlet);
api.use('/search', search);

export default api;
