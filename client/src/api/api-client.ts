import { hc } from 'hono/client';
import type { ApiRoutes } from '@server/index';

const baseUrl = window.location.origin;

export const api = hc<ApiRoutes>(baseUrl);
