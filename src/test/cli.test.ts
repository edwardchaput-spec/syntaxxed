import * as assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

suite('CLI', () => {
	test(
		'runs the shared engine with detail, intent, directory, and output flags',
		async () => {
			const extension = vscode.extensions.getExtension('syntaxxed.syntaxxed');
			assert.ok(extension);
			const fixtureRoot = await mkdtemp(
				path.join(tmpdir(), 'syntaxxed-cli-test-')
			);

			try {
				const secret = 'internal-secret-value-12345';
				await Promise.all([
				writeFile(
					path.join(fixtureRoot, 'checkoutService.ts'),
					[
						'// implementation comment',
						'export function checkoutOrder(total: number): number {',
						`  const api_key = '${secret}';`,
						'  return api_key.length + total;',
						'}',
					].join('\n'),
					'utf8'
				),
				writeFile(
					path.join(fixtureRoot, 'unrelated.ts'),
					"export const unrelated = 'not selected';\n",
					'utf8'
				),
				writeFile(
					path.join(fixtureRoot, 'ignored.ts'),
					"export const ignored = 'excluded';\n",
					'utf8'
				),
				writeFile(
					path.join(fixtureRoot, '.gitignore'),
					'ignored.ts\n',
					'utf8'
				),
				]);

				const outputPath = path.join(fixtureRoot, 'output', 'context.md');
				const cliPath = vscode.Uri.joinPath(
					extension.extensionUri,
					'dist',
					'cli',
					'index.js'
				).fsPath;
				const { stdout, stderr } = await execFileAsync(process.execPath, [
					cliPath,
					'--detail',
					'logic',
					'--intent',
					'checkout',
					'--out',
					outputPath,
					'--dir',
					fixtureRoot,
				]);

				assert.equal(stderr, '');
				assert.match(stdout, /Token Savings:/);
				assert.match(stdout, /Secrets Redacted: 1/);

				const payload = await readFile(outputPath, 'utf8');
				assert.equal(payload.includes('<system_instructions>'), true);
				assert.equal(payload.includes('checkoutService.ts'), true);
				assert.equal(payload.includes('unrelated.ts'), false);
				assert.equal(payload.includes('ignored.ts'), false);
				assert.equal(payload.includes(secret), false);
				assert.equal(payload.includes('[REDACTED_SECRET]'), true);
			} finally {
				await rm(fixtureRoot, { recursive: true, force: true });
			}
		}
	).timeout(15_000);

	test(
		'uses GitHub Action inputs and writes the step summary and outputs',
		async () => {
			const extension = vscode.extensions.getExtension('syntaxxed.syntaxxed');
			assert.ok(extension);
			const fixtureRoot = await mkdtemp(
				path.join(tmpdir(), 'syntaxxed-action-test-')
			);

			try {
				await writeFile(
				path.join(fixtureRoot, 'service.ts'),
				[
					'// remove this comment',
					"const api_key = 'action-secret-value-12345';",
					'export const service = api_key.length;',
				].join('\n'),
				'utf8'
				);

				const outputPath = path.join(fixtureRoot, 'syntaxxed-context.md');
				const summaryPath = path.join(fixtureRoot, 'step-summary.md');
				const githubOutputPath = path.join(fixtureRoot, 'github-output.txt');
				const cliPath = vscode.Uri.joinPath(
					extension.extensionUri,
					'dist',
					'cli',
					'index.js'
				).fsPath;
				const { stdout, stderr } = await execFileAsync(
					process.execPath,
					[cliPath],
					{
						cwd: tmpdir(),
						env: {
							...process.env,
							GITHUB_ACTIONS: 'true',
							GITHUB_WORKSPACE: fixtureRoot,
							GITHUB_STEP_SUMMARY: summaryPath,
							GITHUB_OUTPUT: githubOutputPath,
							INPUT_DETAIL: 'logic',
							INPUT_INTENT: '',
							INPUT_OUT: outputPath,
						},
					},
				);

				assert.equal(stderr, '');
				assert.match(stdout, /Secrets Redacted: 1/);

				const payload = await readFile(outputPath, 'utf8');
				assert.equal(payload.includes('service.ts'), true);
				assert.equal(
					payload.includes('action-secret-value-12345'),
					false
				);

				const summary = await readFile(summaryPath, 'utf8');
				assert.match(summary, /\| Tokens Saved \| [\d,]+ \|/);
				assert.match(summary, /\| Secrets Redacted \| 1 \|/);

				const githubOutput = await readFile(githubOutputPath, 'utf8');
				assert.match(githubOutput, /output-path<</);
				assert.equal(githubOutput.includes(outputPath), true);
				assert.match(githubOutput, /tokens-saved<</);
				assert.match(githubOutput, /secrets-redacted<</);
			} finally {
				await rm(fixtureRoot, { recursive: true, force: true });
			}
		}
	).timeout(15_000);
});
