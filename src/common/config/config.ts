import { AsciiTable3 } from 'ascii-table3';
import { configSchema } from './config.schema';

const result = configSchema.safeParse(process.env);

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
export const config = result.data;
