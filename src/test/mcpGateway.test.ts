import * as assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as vscode from 'vscode';
import { initializeAstParser } from '../engine';
import {
	SyntaxxedMcpGateway,
	type GatewayAuditEvent,
} from '../mcp/server';

function resultText(result: unknown): string {
	const typedResult = result as CallToolResult;
	const content = typedResult.content.find((item) => item.type === 'text');
	assert.ok(content && content.type === 'text');
	return content.text;
}

suite('MCP Gateway', () => {
	suiteSetup(async () => {
		const extension = vscode.extensions.getExtension('syntaxxed.syntaxxed');
		assert.ok(extension);
		await extension.activate();
		await initializeAstParser(
			vscode.Uri.joinPath(
				extension.extensionUri,
				'media',
				'tree-sitter'
			).fsPath
		);
	});

	test('authenticates clients and scopes disclosure grants by detail level', async () => {
		const workspaceRoot = await mkdtemp(
			path.join(tmpdir(), 'syntaxxed-mcp-gateway-test-')
		);
		const sourceDirectory = path.join(workspaceRoot, 'src');
		await mkdir(sourceDirectory);
		await writeFile(
			path.join(sourceDirectory, 'example.ts'),
			[
				'// internal comment',
				'export function calculate(): number {',
				'  return 42;',
				'}',
			].join('\n'),
			'utf8'
		);
		await Promise.all([
			writeFile(
				path.join(sourceDirectory, 'unsupported.py'),
				"def calculate():\n    return 'UNAPPROVED_PYTHON_BODY'\n",
				'utf8'
			),
			writeFile(
				path.join(sourceDirectory, 'invalid.ts'),
				"export function broken( { return 'UNAPPROVED_INVALID_BODY'; }\n",
				'utf8'
			),
		]);

		let approvalCount = 0;
		const auditEvents: GatewayAuditEvent[] = [];
		const gateway = new SyntaxxedMcpGateway({
			workspaceRoot,
			workspaceName: 'gateway-test',
			authToken: 'test-token',
			approvalProvider: () => {
				approvalCount++;
				return Promise.resolve('allow-file-for-session');
			},
			onAuditEvent: (event) => auditEvents.push(event),
		});

		try {
			const endpoint = await gateway.start();
			const authenticatedHeaders = {
				Authorization: endpoint.authorizationHeader,
			};
			const unauthorized = await fetch(endpoint.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'initialize',
					params: {
						protocolVersion: '2025-11-25',
						capabilities: {},
						clientInfo: { name: 'unauthorized-test', version: '1' },
					},
				}),
			});
			assert.equal(unauthorized.status, 401);

			const unsupportedMedia = await fetch(endpoint.url, {
				method: 'POST',
				headers: {
					...authenticatedHeaders,
					'Content-Type': 'text/plain',
				},
				body: '{}',
			});
			assert.equal(unsupportedMedia.status, 415);

			const invalidJson = await fetch(endpoint.url, {
				method: 'POST',
				headers: {
					...authenticatedHeaders,
					'Content-Type': 'application/json',
				},
				body: '{',
			});
			assert.equal(invalidJson.status, 400);

			const oversized = await fetch(endpoint.url, {
				method: 'POST',
				headers: {
					...authenticatedHeaders,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ payload: 'x'.repeat(1024 * 1024) }),
			});
			assert.equal(oversized.status, 413);

			const client = new Client({ name: 'syntaxxed-test', version: '1.0.0' });
			const transport = new StreamableHTTPClientTransport(
				new URL(endpoint.url),
				{
					requestInit: {
						headers: authenticatedHeaders,
					},
				}
			);
			await client.connect(
				transport as unknown as Parameters<Client['connect']>[0]
			);

			const outline = resultText(
				await client.callTool({
					name: 'get_file_outline',
					arguments: { filePath: 'src/example.ts' },
				})
			);
			assert.equal(outline.includes('calculate(): number {}'), true);
			assert.equal(outline.includes('return 42'), false);

			const unsupportedOutline = (await client.callTool({
				name: 'get_file_outline',
				arguments: { filePath: 'src/unsupported.py' },
			})) as CallToolResult;
			assert.equal(unsupportedOutline.isError, true);
			assert.equal(
				resultText(unsupportedOutline).includes('UNAPPROVED_PYTHON_BODY'),
				false
			);

			const invalidOutline = (await client.callTool({
				name: 'get_file_outline',
				arguments: { filePath: 'src/invalid.ts' },
			})) as CallToolResult;
			assert.equal(invalidOutline.isError, true);
			assert.equal(
				resultText(invalidOutline).includes('UNAPPROVED_INVALID_BODY'),
				false
			);

			for (let index = 0; index < 2; index++) {
				const logic = resultText(
					await client.callTool({
						name: 'request_file_logic',
						arguments: { filePath: 'src/example.ts' },
					})
				);
				assert.equal(logic.includes('return 42'), true);
			}
			assert.equal(approvalCount, 1);

			const source = resultText(
				await client.callTool({
					name: 'request_file_source',
					arguments: { filePath: 'src/example.ts' },
				})
			);
			assert.equal(source.includes('// internal comment'), true);
			assert.equal(approvalCount, 2);
			assert.equal(
				auditEvents.some(
					(event) =>
						event.action === 'request-rejected' &&
						event.detail === 'invalid-authorization'
				),
				true
			);

			await client.close();
		} finally {
			await gateway.stop();
			await rm(workspaceRoot, { recursive: true, force: true });
		}
	});
});
