import { hc } from 'hono/client';
import type { ApiRoutes } from '@server/index';

export const client = hc<ApiRoutes>('/');
