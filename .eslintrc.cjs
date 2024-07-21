/* eslint-env node */
/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:import/typescript',
		'plugin:import/recommended',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: './',
	},
	settings: {
		'import/resolver': {
			typescript: {},
		},
	},
	plugins: ['@typescript-eslint', 'import'],
	root: true,
	ignorePatterns: [
		'dist/*',
		'node_modules/*',
		'scripts/*',
		'.eslintrc.cjs',
		'jest.config.js',
		'*.test.ts',
	],
	rules: {
		'@typescript-eslint/consistent-type-imports': 'error',
		'import/order': [
			'error',
			{
				pathGroups: [
					{
						pattern: '@/**',
						group: 'internal',
					},
				],
			},
		],
		'import/no-named-as-default': 'off',
		'import/no-named-as-default-member': 'off',
	},
};
