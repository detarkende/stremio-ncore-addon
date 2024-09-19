import type { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export const applyMiddlewares = (app: Hono): void => {
	app.use(cors());
	app.use(logger());
};
