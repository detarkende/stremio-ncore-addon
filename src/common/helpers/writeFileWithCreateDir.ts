import path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

/**
 * A wrapper around `fs.writeFileSync` that creates the parent directories if it doesn't exist.
 */
export const writeFileWithCreateDir: typeof writeFileSync = (filePath, ...restArgs) => {
	const dirPath = path.dirname(filePath.toString());
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
	}
	writeFileSync(filePath, ...restArgs);
};
