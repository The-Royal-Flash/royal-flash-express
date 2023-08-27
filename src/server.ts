import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import api from './api/api';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	cors({
		origin: [process.env.FE_SERVER as string],
		methods: ['GET', 'POST', 'DELETE'],
		credentials: true,
	}),
);

app.use('/api', api);

export default app;
