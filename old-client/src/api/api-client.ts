import { hc } from 'hono/client';
import type { ApiRoutes } from '@sna/server';

export const { api } = hc<ApiRoutes>(window.location.origin);
