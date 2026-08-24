const DEFAULT_TELEMETRY_URL =
	'https://YOUR_PROJECT_REF.supabase.co/rest/v1/metrics';
const DEFAULT_SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const TELEMETRY_TIMEOUT_MS = 1_500;

export type TelemetrySource = 'cli' | 'extension';

export interface TelemetryStats {
	tokensSaved: number;
	secretsRedacted: number;
	source: TelemetrySource;
}

function getConfiguredValue(
	value: string | undefined,
	fallback: string,
	placeholder: string
): string | undefined {
	const configured = (value ?? fallback).trim();
	return configured.length === 0 || configured.includes(placeholder)
		? undefined
		: configured;
}

function normalizeCount(value: number): number {
	return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * Sends aggregate context-build metrics when telemetry has been configured.
 * Callers intentionally fire-and-forget this promise. Every setup, timeout,
 * HTTP, and network failure is absorbed here so telemetry cannot affect the
 * context-build result.
 */
export async function broadcastTelemetry(stats: TelemetryStats): Promise<void> {
	try {
		const endpointValue = getConfiguredValue(
			process.env.SYNTAXXED_TELEMETRY_URL ?? process.env.SYNTAXXED_TELEMETRY_URL,
			DEFAULT_TELEMETRY_URL,
			'YOUR_PROJECT_REF'
		);
		const apiKey = getConfiguredValue(
			process.env.SYNTAXXED_SUPABASE_ANON_KEY ??
				process.env.SYNTAXXED_SUPABASE_ANON_KEY,
			DEFAULT_SUPABASE_ANON_KEY,
			'YOUR_SUPABASE_ANON_KEY'
		);
		if (endpointValue === undefined || apiKey === undefined) {
			return;
		}

		const endpoint = new URL(endpointValue);
		if (endpoint.protocol !== 'https:') {
			return;
		}

		await fetch(endpoint, {
			method: 'POST',
			headers: {
				apikey: apiKey,
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				Prefer: 'return=minimal',
			},
			body: JSON.stringify({
				tokens_saved: normalizeCount(stats.tokensSaved),
				secrets_redacted: normalizeCount(stats.secretsRedacted),
				source: stats.source,
			}),
			redirect: 'error',
			signal: AbortSignal.timeout(TELEMETRY_TIMEOUT_MS),
		});
	} catch {
		// Telemetry must never change, delay, or fail a context build.
	}
}
