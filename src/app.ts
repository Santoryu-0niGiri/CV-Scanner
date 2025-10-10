import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

dotenv.config();

/**
 * Express application instance
 * Configures middleware, routes, and error handlers
 */
const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'CV Scanner API is running!' });
});

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
