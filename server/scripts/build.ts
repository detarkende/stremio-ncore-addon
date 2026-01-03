import { rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { build, type Plugin } from 'esbuild';

const baseDir = path.resolve(import.meta.dirname, '..');
const distPath = `${baseDir}/dist`;

if (existsSync(distPath)) {
  console.log(`Deleting old dist folder ("${distPath}")`);
  await rm(distPath, { recursive: true });
}

const commonBuildOptions: Parameters<typeof build>[0] = {
  bundle: true,
  format: 'esm',
  packages: 'external',
  outdir: distPath,
  splitting: false,
  sourcemap: true,
  treeShaking: true,
  tsconfig: `${baseDir}/tsconfig.app.json`,
};

console.log('Building server with esbuild...');
await build({
  ...commonBuildOptions,
  entryPoints: [`${baseDir}/src/index.ts`],
  platform: 'node',
  target: 'node22',
});

const migrationsSrc = `${baseDir}/src/db/migrations`;
const migrationsDest = `${distPath}/migrations`;

console.log(`Copying migrations folder from "${migrationsSrc}" to "${migrationsDest}"`);
await cp(migrationsSrc, migrationsDest, { recursive: true });

console.log('Building exports with esbuild...');
await build({
  ...commonBuildOptions,
  entryPoints: [`${baseDir}/src/exports.ts`],
  platform: 'browser',
  target: 'esnext',
  plugins: [],
});

console.log('Build complete!');
process.exit(0);
