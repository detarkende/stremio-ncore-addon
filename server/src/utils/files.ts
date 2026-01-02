import path from 'node:path';
import fs from 'node:fs';

export function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getHighestCommonDir(paths: string[]): string | null {
  if (paths.length === 0) return null;
  if (paths.length === 1) return paths[0];

  const startsWithSlash = paths[0].startsWith(path.sep);

  const splitPaths = paths.map((p) => p.split(path.sep).filter(Boolean));
  const minLength = Math.min(...splitPaths.map((parts) => parts.length));

  const commonSegments: string[] = [];
  for (let i = 0; i < minLength; i++) {
    const segment = splitPaths[0][i];
    if (splitPaths.every((parts) => parts[i] === segment)) {
      commonSegments.push(segment);
    }
  }
  if (commonSegments.length === 0) return null;
  return `${startsWithSlash ? path.sep : ''}${commonSegments.join(path.sep)}`;
}
