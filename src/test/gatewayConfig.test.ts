import * as assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
	ensureMcpRegistrations,
	removeMcpRegistrations,
} from '../engine';

suite('Gateway configuration', () => {
	test('reconciles the Syntaxxed gateway and preserves other registrations', async () => {
		const workspaceRoot = await mkdtemp(
			path.join(tmpdir(), 'syntaxxed-gateway-config-test-')
		);

		try {
			await writeFile(
				path.join(workspaceRoot, '.mcp.json'),
				JSON.stringify({
					mcpServers: {
						existing: { command: 'existing-server' },
					'syntaxxed-gateway': { command: 'outdated-server' },
					},
				}),
				'utf8'
			);

			const registration = {
				url: 'http://127.0.0.1:43123/mcp',
				authorizationHeader: 'Bearer test-token',
			};
			const installed = await ensureMcpRegistrations(
				workspaceRoot,
				registration
			);
			assert.equal(installed.failed.length, 0);
			assert.equal(installed.created.includes('.cursor/mcp.json'), true);
			assert.equal(installed.updated.includes('.mcp.json'), true);

			for (const relativePath of ['.mcp.json', '.cursor/mcp.json']) {
				const config = JSON.parse(
					await readFile(path.join(workspaceRoot, relativePath), 'utf8')
				) as {
					mcpServers: Record<string, unknown>;
				};
				assert.deepEqual(config.mcpServers['syntaxxed-gateway'], {
					type: 'http',
					url: registration.url,
					headers: {
						Authorization: registration.authorizationHeader,
					},
				});
				assert.equal('syntaxxed-gateway' in config.mcpServers, true);
			}

			const removed = await removeMcpRegistrations(workspaceRoot);
			assert.equal(removed.failed.length, 0);
			const claudeConfig = JSON.parse(
				await readFile(path.join(workspaceRoot, '.mcp.json'), 'utf8')
			) as { mcpServers: Record<string, unknown> };
			assert.deepEqual(claudeConfig.mcpServers['existing'], {
				command: 'existing-server',
			});
			assert.equal('syntaxxed-gateway' in claudeConfig.mcpServers, false);
		} finally {
			await rm(workspaceRoot, { recursive: true, force: true });
		}
	});
});
