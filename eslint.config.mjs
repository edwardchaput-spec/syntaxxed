import { defineConfig } from 'eslint/config';
import typescriptEslint from 'typescript-eslint';

export default defineConfig(
	{
		ignores: ['dist/**', 'out/**', 'node_modules/**'],
	},
	...typescriptEslint.configs.recommendedTypeChecked,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ prefer: 'type-imports', fixStyle: 'inline-type-imports' },
			],
			'@typescript-eslint/no-deprecated': 'error',
			'@typescript-eslint/no-import-type-side-effects': 'error',
			'@typescript-eslint/only-throw-error': 'error',
			'@typescript-eslint/prefer-readonly': 'error',
			'@typescript-eslint/return-await': ['error', 'in-try-catch'],
			curly: ['error', 'all'],
			eqeqeq: ['error', 'always'],
			'no-throw-literal': 'error',
			semi: ['error', 'always'],
		},
	},
	{
		files: ['src/cli/**/*.ts'],
		languageOptions: {
			parserOptions: {
				projectService: false,
				project: './tsconfig.cli.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
	}
);
