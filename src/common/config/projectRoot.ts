import { resolve } from 'path';
import { fileURLToPath } from 'url';

export const projectRoot = resolve(fileURLToPath(import.meta.url), '../../../..');
