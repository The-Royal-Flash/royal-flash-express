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
		origin: 'https://web-royal-flash-react-3prof2llkv7xq3p.sel4.cloudtype.app',
		methods: ['GET', 'POST'],
		credentials: true,
	}),
);

app.use('/uploads', express.static('uploads'));
app.use('/api', api);

export default app;
