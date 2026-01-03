import type { ApiRoutes } from '@sna/server';
import { hc } from 'hono/client';

export const apiClient = hc<ApiRoutes>(window.location.origin);
