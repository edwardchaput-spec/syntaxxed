import * as assert from 'node:assert/strict';
import {
	normalizeCustomRedactionRules,
	redactSecrets,
} from '../engine/secretScanner';

const repeated = (character: string, length: number): string =>
	character.repeat(length);

suite('Secret scanner', () => {
	const providerCases: ReadonlyArray<readonly [string, () => string]> = [
		['AWS long-term access key', () => `AKIA${repeated('A', 16)}`],
		['AWS temporary access key', () => `ASIA${repeated('A', 16)}`],
		['GitHub token', () => `ghp_${repeated('A', 36)}`],
		['GitHub fine-grained token', () => `github_pat_${repeated('A', 82)}`],
		['GitLab token', () => `glpat-${repeated('A', 24)}`],
		['OpenAI key', () => `sk-proj-${repeated('A', 40)}`],
		['Anthropic key', () => `sk-ant-api03-${repeated('A', 40)}`],
		[
			'Slack bot token',
			() => `xoxb-${repeated('1', 12)}-${repeated('A', 24)}`,
		],
		['Google API key', () => `AIza${repeated('A', 35)}`],
		['Stripe secret', () => `sk_live_${repeated('A', 24)}`],
		['npm token', () => `npm_${repeated('A', 36)}`],
		[
			'SendGrid key',
			() => `SG.${repeated('A', 16)}.${repeated('B', 24)}`,
		],
	];

	for (const [name, createSecret] of providerCases) {
		test(`redacts a synthetic ${name}`, () => {
			const secret = createSecret();
			const result = redactSecrets(`value=${secret}`);

			assert.equal(result.secretCount, 1);
			assert.equal(result.redactedText.includes(secret), false);
			assert.equal(result.redactedText, 'value=[REDACTED_SECRET]');
		});
	}

	test('redacts generic assignments containing punctuation', () => {
		const value = `correct-horse+battery/staple=${repeated('7', 8)}`;
		const result = redactSecrets(`database_password="${value}"`);

		assert.equal(result.secretCount, 1);
		assert.equal(result.redactedText, '[REDACTED_SECRET]');
	});

	test('redacts an AWS secret access key assignment', () => {
		const value = repeated('A', 40);
		const result = redactSecrets(`AWS_SECRET_ACCESS_KEY=${value}`);

		assert.equal(result.secretCount, 1);
		assert.equal(result.redactedText.includes(value), false);
	});

	test('redacts credentials embedded in a URL', () => {
		const password = `db-${repeated('A', 24)}`;
		const result = redactSecrets(
			`DATABASE_URL=postgres://app:${password}@db.example.test/app`
		);

		assert.equal(result.secretCount, 1);
		assert.equal(result.redactedText.includes(password), false);
	});

	test('redacts private key blocks', () => {
		const privateKey = [
			'-----BEGIN PRIVATE KEY-----',
			repeated('A', 64),
			'-----END PRIVATE KEY-----',
		].join('\n');
		const result = redactSecrets(privateKey);

		assert.equal(result.secretCount, 1);
		assert.equal(result.redactedText, '[REDACTED_SECRET]');
	});

	test('does not redact environment references or placeholders', () => {
		const text = [
			'api_key = process.env.API_KEY',
			'client_secret = "${CLIENT_SECRET}"',
			'password = "<your-password>"',
		].join('\n');

		assert.deepEqual(redactSecrets(text), {
			redactedText: text,
			secretCount: 0,
		});
	});

	test('counts overlapping detectors as one secret span', () => {
		const token = `ghp_${repeated('A', 36)}`;
		const result = redactSecrets(`api_key=${token}`);

		assert.equal(result.secretCount, 1);
		assert.equal(result.redactedText, '[REDACTED_SECRET]');
	});

	test('applies a validated team-specific redaction rule', () => {
		const normalized = normalizeCustomRedactionRules([
			{
				name: 'Internal ADY key',
				pattern: String.raw`\bADY_KEY_[A-Z0-9]{16}\b`,
				flags: 'i',
			},
		]);
		const secret = `ADY_KEY_${repeated('7', 16)}`;
		const result = redactSecrets(`staging=${secret}`, normalized.rules);

		assert.equal(normalized.invalidCount, 0);
		assert.equal(normalized.rules[0]?.flags, 'gi');
		assert.equal(result.redactedText, 'staging=[REDACTED_SECRET]');
		assert.equal(result.secretCount, 1);
	});

	test('rejects invalid or unsafe custom regular expressions', () => {
		const normalized = normalizeCustomRedactionRules([
			{ name: 'Broken', pattern: '[', flags: 'i' },
			{ name: 'Nested repetition', pattern: '(a+)+$', flags: '' },
			{ name: 'Lookbehind', pattern: '(?<=secret)\\w+', flags: '' },
			{ name: 'Unsupported flags', pattern: 'safe', flags: 'y' },
		]);

		assert.deepEqual(normalized, { rules: [], invalidCount: 4 });
	});
});
