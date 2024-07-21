import { resolve } from 'path';
import { readFileSync } from 'fs';
import type { z } from 'zod';
import { AsciiTable3 } from 'ascii-table3';
import { configSchema } from './config.schema';
import { projectRoot } from './projectRoot';

type Config = z.infer<typeof configSchema>;

export const config = (): Config => {
	const configPath = resolve(projectRoot, 'config.json');

	const configJson = readFileSync(configPath, 'utf-8');

	const result = configSchema.safeParse(JSON.parse(configJson));

	if (!result.success) {
		const errorTable = new AsciiTable3()
			.setHeading('Field', 'Error')
			.setWidths([50, 50])
			.setWrappings([true, true])
			.setStyle('unicode-round');

		const rows = [];
		for (let i = 0; i < result.error.errors.length; i++) {
			const error = result.error.errors[i]!;
			rows.push([error.path.join('.'), error.message]);
			if (i !== result.error.errors.length - 1) {
				rows.push([
					'─'.repeat(errorTable.getWidth(1) - 2),
					'─'.repeat(errorTable.getWidth(2) - 2),
				]);
			}
		}
		errorTable.addRowMatrix(rows);

		console.error(
			`\n\nYour config.json has some issues. Here are the issues that we have found:\n${errorTable.toString()}\n\n`,
		);
		throw new Error('Invalid config.json');
	}
	return result.data;
};
