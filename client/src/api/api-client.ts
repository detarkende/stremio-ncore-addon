import { hc } from 'hono/client';
import type { ApiRoutes } from '@server/index';

const baseUrl = window.location.origin;

const apiBaseUrl = `${baseUrl}/api`;

export const api = hc<ApiRoutes>(apiBaseUrl);
