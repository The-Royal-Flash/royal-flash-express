import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import api from './api/api';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	cors({
		origin: 'http://localhost:5173',
		methods: ['GET', 'POST'],
		credentials: true,
	}),
);

app.use('/uploads', express.static('uploads'));
app.use('/api', api);

export default app;
