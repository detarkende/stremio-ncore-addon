import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const distFiles = globSync('dist/**/*.js');

for (const file of distFiles) {
	const fileContent = readFileSync(file, 'utf-8').split('\n');
	for (let i = 0; i < fileContent.length; i++) {
		if (/import .* from '\.{1,2}.*';$/.test(fileContent[i])) {
			fileContent[i] = fileContent[i].replace(/';$/, `.js';`);
		}
	}
	writeFileSync(file, fileContent.join('\n'));
}
