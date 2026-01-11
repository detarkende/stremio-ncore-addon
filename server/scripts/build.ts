import { rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { build, type Options } from 'tsup';
import { builtinModules } from 'node:module';

const baseDir = path.resolve(import.meta.dirname, '..');
const distPath = path.resolve(baseDir, 'dist');

if (existsSync(distPath)) {
  console.log(`Deleting old dist folder ("${distPath}")`);
  await rm(distPath, { recursive: true });
}

const commonBuildOptions: Options = {
  bundle: true,
  format: 'esm',
  outDir: distPath,
  clean: false,
  sourcemap: true,
  treeshake: true,
  tsconfig: path.resolve(baseDir, 'tsconfig.json'),
  dts: false,
  splitting: false,
};

console.log('Building server with tsup...');
await build({
  ...commonBuildOptions,
  entry: [path.resolve(baseDir, 'src/index.ts')],
  platform: 'node',
  target: 'node22',
});

const migrationsSrc = path.resolve(baseDir, 'src/db/migrations');
const migrationsDest = path.resolve(distPath, 'migrations');

console.log(`Copying migrations folder from "${migrationsSrc}" to "${migrationsDest}"`);
await cp(migrationsSrc, migrationsDest, { recursive: true });

console.log('Building exports with tsup...');
await build({
  ...commonBuildOptions,
  entry: [path.resolve(baseDir, 'src/exports.ts')],
  platform: 'browser',
  target: 'esnext',
  dts: true,
  external: [...builtinModules, /node:.*/],
});

console.log('Build complete!');
process.exit(0);
