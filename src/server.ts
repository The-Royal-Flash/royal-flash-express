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
		origin: '*',
		methods: ['GET', 'POST', 'DELETE', 'UPDATE'],
		credentials: true,
	}),
);

app.use('/uploads', express.static('uploads'));
app.use('/api', api);

export default app;
