import * as assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
	createWorkspaceConfigFile,
	getDefaultConfigFileContent,
	loadWorkspaceConfigs,
	scanWorkspace,
	scanWorkspaceFile,
} from '../engine';

suite('Engine filesystem', () => {
	test('creates a neutral config that keeps tests and scripts eligible', () => {
		assert.deepEqual(JSON.parse(getDefaultConfigFileContent()), {
			include_comments: false,
			exclude: [],
		});
	});

	test('uses native config and nested ignore traversal', async () => {
		const workspaceRoot = await mkdtemp(
			path.join(tmpdir(), 'syntaxxed-engine-test-')
		);

		try {
			const firstCreation = await createWorkspaceConfigFile(workspaceRoot);
			const secondCreation = await createWorkspaceConfigFile(workspaceRoot);
			assert.equal(firstCreation.created, true);
			assert.equal(secondCreation.created, false);

			const nestedPath = path.join(workspaceRoot, 'nested');
			await mkdir(nestedPath);
			await Promise.all([
				writeFile(
					path.join(workspaceRoot, 'syntaxxed.json'),
					JSON.stringify({
						include_comments: false,
						exclude: ['custom.ts'],
					}),
					'utf8'
				),
				writeFile(
					path.join(workspaceRoot, 'custom.ts'),
					'export const custom = true;\n',
					'utf8'
				),
				writeFile(
					path.join(nestedPath, '.gitignore'),
					'ignored.ts\n',
					'utf8'
				),
				writeFile(
					path.join(nestedPath, 'ignored.ts'),
					'export const ignored = true;\n',
					'utf8'
				),
				writeFile(
					path.join(nestedPath, 'kept.ts'),
					'export const kept = true;\n',
					'utf8'
				),
			]);

			const configs = await loadWorkspaceConfigs([workspaceRoot]);
			const outcome = await scanWorkspace(
				{ workspaceRoots: [workspaceRoot] },
				configs
			);
			const paths = new Set(
				outcome.files.map((file) => file.relativePath)
			);

			assert.equal(paths.has('custom.ts'), false);
			assert.equal(paths.has('nested/ignored.ts'), false);
			assert.equal(paths.has('nested/kept.ts'), true);

			const config = configs.get(path.resolve(workspaceRoot));
			assert.ok(config);
			const singleFile = await scanWorkspaceFile(
				{
					workspaceRoot,
					relativePath: 'nested/kept.ts',
				},
				config
			);
			assert.equal(singleFile?.relativePath, 'nested/kept.ts');
			assert.equal(singleFile?.content.includes('kept = true'), true);
			assert.equal(
				await scanWorkspaceFile(
					{
						workspaceRoot,
						relativePath: 'nested/ignored.ts',
					},
					config
				),
				null
			);
			await assert.rejects(
				scanWorkspaceFile(
					{ workspaceRoot, relativePath: '../outside.ts' },
					config
				),
				/within the selected workspace/
			);
		} finally {
			await rm(workspaceRoot, { recursive: true, force: true });
		}
	});

	test('hard-excludes MCP registration files that can contain credentials', async () => {
		const workspaceRoot = await mkdtemp(
			path.join(tmpdir(), 'syntaxxed-mcp-config-test-')
		);

		try {
			await mkdir(path.join(workspaceRoot, '.cursor'));
			await Promise.all([
				writeFile(
					path.join(workspaceRoot, '.mcp.json'),
					'{"mcpServers":{"local":{"headers":{"Authorization":"Bearer secret"}}}}',
					'utf8'
				),
				writeFile(
					path.join(workspaceRoot, '.cursor', 'mcp.json'),
					'{"mcpServers":{"local":{"token":"secret"}}}',
					'utf8'
				),
				writeFile(
					path.join(workspaceRoot, 'kept.ts'),
					'export const kept = true;\n',
					'utf8'
				),
			]);

			const outcome = await scanWorkspace({ workspaceRoots: [workspaceRoot] });
			assert.deepEqual(
				outcome.files.map((file) => file.relativePath),
				['kept.ts']
			);
			assert.equal(
				await scanWorkspaceFile({
					workspaceRoot,
					relativePath: '.mcp.json',
				}),
				null
			);
			assert.equal(
				await scanWorkspaceFile({
					workspaceRoot,
					relativePath: '.cursor/mcp.json',
				}),
				null
			);
		} finally {
			await rm(workspaceRoot, { recursive: true, force: true });
		}
	});
});
