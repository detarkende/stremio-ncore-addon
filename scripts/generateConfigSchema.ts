import { zodToJsonSchema } from 'zod-to-json-schema';
import { configSchema } from '../src/common/config/config.schema';
import { projectRoot } from '../src/common/config/projectRoot';
import {writeFileWithCreateDir} from '../src/common/helpers/writeFileWithCreateDir';

const schema = zodToJsonSchema(configSchema, { errorMessages: true, name: 'configSchema' });

writeFileWithCreateDir(
	`${projectRoot}/.vscode/schemas/config.schema.json`,
	JSON.stringify(schema, null, '\t'),
);
