import type { ApiRoutes } from '@server/exports';
import { hc } from 'hono/client';

export const apiClient = hc<ApiRoutes>(window.location.origin);
