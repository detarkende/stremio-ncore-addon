import type { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { relative, resolve } from 'path';

export const applyServeStatic = (app: Hono) => {
  const reserverRoutes = [/^\/api\/.*/, /^\/manifest\.json$/];
  const clientPath = resolve(import.meta.dirname, '../../client');
  const relativePath = relative(process.cwd(), clientPath);
  app.use(async (c, next) => {
    let { pathname } = new URL(c.req.url);
    if (reserverRoutes.some((regex) => regex.test(pathname))) {
      return next();
    }
    if (pathname === '/') {
      pathname = '/index.html';
    }
    let filePath = resolve(clientPath, pathname.slice(1));
    if (existsSync(filePath)) {
      return serveStatic({ root: relativePath })(c, next);
    }
    filePath = resolve(clientPath, 'index.html');
    return c.html(await readFile(filePath, { encoding: 'utf-8' }));
  });
};
