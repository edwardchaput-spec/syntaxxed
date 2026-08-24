import * as assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { buildWorkspaceContext } from '../engine';
import { broadcastTelemetry } from '../engine/telemetry';

const TELEMETRY_ENVIRONMENT_KEYS = [
	'SYNTAXXED_TELEMETRY_URL',
	'SYNTAXXED_SUPABASE_ANON_KEY',
	'SYNTAXXED_TELEMETRY_URL',
	'SYNTAXXED_SUPABASE_ANON_KEY',
] as const;

suite('Telemetry', () => {
	const originalFetch = globalThis.fetch;
	const originalEnvironment = new Map(
		TELEMETRY_ENVIRONMENT_KEYS.map((key) => [key, process.env[key]])
	);

	teardown(() => {
		globalThis.fetch = originalFetch;
		for (const key of TELEMETRY_ENVIRONMENT_KEYS) {
			const value = originalEnvironment.get(key);
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		}
	});

	test('does nothing when the Supabase placeholders are not configured', async () => {
		delete process.env.SYNTAXXED_TELEMETRY_URL;
		delete process.env.SYNTAXXED_SUPABASE_ANON_KEY;
		delete process.env.SYNTAXXED_TELEMETRY_URL;
		delete process.env.SYNTAXXED_SUPABASE_ANON_KEY;
		let requestCount = 0;
		globalThis.fetch = () => {
			requestCount += 1;
			return Promise.resolve(new Response(null, { status: 201 }));
		};

		await broadcastTelemetry({
			tokensSaved: 100,
			secretsRedacted: 2,
			source: 'extension',
		});

		assert.equal(requestCount, 0);
	});

	test('posts only aggregate metrics with Supabase headers', async () => {
		process.env.SYNTAXXED_TELEMETRY_URL =
			'https://example.supabase.co/rest/v1/metrics';
		process.env.SYNTAXXED_SUPABASE_ANON_KEY = 'test-anon-key';
		let requestUrl = '';
		let requestOptions: RequestInit | undefined;
		globalThis.fetch = (input, init) => {
			requestUrl =
				typeof input === 'string'
					? input
					: input instanceof URL
					? input.href
					: input.url;
			requestOptions = init;
			return Promise.resolve(new Response(null, { status: 201 }));
		};

		await broadcastTelemetry({
			tokensSaved: 1_234.9,
			secretsRedacted: 3,
			source: 'cli',
		});

		assert.equal(
			requestUrl,
			'https://example.supabase.co/rest/v1/metrics'
		);
		assert.equal(requestOptions?.method, 'POST');
		assert.deepEqual(requestOptions?.headers, {
			apikey: 'test-anon-key',
			Authorization: 'Bearer test-anon-key',
			'Content-Type': 'application/json',
			Prefer: 'return=minimal',
		});
		const requestBody = requestOptions?.body;
		if (typeof requestBody !== 'string') {
			assert.fail('Expected telemetry request body to be JSON text.');
		}
		assert.deepEqual(JSON.parse(requestBody), {
			tokens_saved: 1_234,
			secrets_redacted: 3,
			source: 'cli',
		});
	});

	test('silently absorbs network failures', async () => {
		process.env.SYNTAXXED_TELEMETRY_URL =
			'https://example.supabase.co/rest/v1/metrics';
		process.env.SYNTAXXED_SUPABASE_ANON_KEY = 'test-anon-key';
		globalThis.fetch = () => Promise.reject(new Error('offline'));

		await assert.doesNotReject(
			broadcastTelemetry({
				tokensSaved: 100,
				secretsRedacted: 2,
				source: 'extension',
			})
		);
	});

	test('does not make buildWorkspaceContext wait for a pending request', async () => {
		process.env.SYNTAXXED_TELEMETRY_URL =
			'https://example.supabase.co/rest/v1/metrics';
		process.env.SYNTAXXED_SUPABASE_ANON_KEY = 'test-anon-key';
		const fixtureRoot = await mkdtemp(
			path.join(tmpdir(), 'syntaxxed-telemetry-test-')
		);
		let finishRequest: ((response: Response) => void) | undefined;
		globalThis.fetch = () =>
			new Promise<Response>((resolve) => {
				finishRequest = resolve;
			});

		try {
			await writeFile(
				path.join(fixtureRoot, 'service.ts'),
				'// comment\nexport const service = true;\n',
				'utf8'
			);

			const result = await buildWorkspaceContext({
				workspaceRoots: [fixtureRoot],
				source: 'cli',
			});

			assert.equal(result.fileCount, 1);
			assert.equal(typeof finishRequest, 'function');
		} finally {
			finishRequest?.(new Response(null, { status: 201 }));
			await rm(fixtureRoot, { recursive: true, force: true });
		}
	});
});
