import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

/** Server key agents see in their MCP configuration. */
export const MCP_SERVER_NAME = 'syntaxxed-gateway';

interface McpRegistrationTarget {
	/** Path segments below the workspace root. */
	segments: readonly string[];
	/** Server entry written under `mcpServers[MCP_SERVER_NAME]`. */
	entry: Readonly<Record<string, unknown>>;
}

export interface McpHttpRegistration {
	url: string;
	authorizationHeader: string;
}

/** Cursor project config plus Claude Code's project-scoped equivalent. */
function registrationTargets(
	registration: McpHttpRegistration
): readonly McpRegistrationTarget[] {
	const entry = {
		type: 'http',
		url: registration.url,
		headers: { Authorization: registration.authorizationHeader },
	};
	return [
		{
			segments: ['.cursor', 'mcp.json'],
			entry,
		},
		{
			segments: ['.mcp.json'],
			entry,
		},
	];
}

export interface McpRegistrationResult {
	/** Config files created from scratch. */
	created: string[];
	/** Existing config files that had the gateway entry merged in. */
	updated: string[];
	/** Files already containing an up-to-date gateway entry. */
	skipped: string[];
	/** Files left untouched because they could not be parsed safely. */
	failed: string[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return (
		typeof value === 'object' && value !== null && !Array.isArray(value)
	);
}

function entryMatches(
	existing: unknown,
	entry: Readonly<Record<string, unknown>>
): boolean {
	return JSON.stringify(existing) === JSON.stringify(entry);
}

function serializeConfig(config: Record<string, unknown>): string {
	return JSON.stringify(config, null, 2) + '\n';
}

/**
 * Register the local gateway in `.cursor/mcp.json` (Cursor) and `.mcp.json`
 * (Claude Code) at the workspace root so agents connect without manual
 * setup. Existing configs are merged, never replaced; unparseable files are
 * left untouched.
 */
export async function ensureMcpRegistrations(
	workspaceRoot: string,
	registration: McpHttpRegistration
): Promise<McpRegistrationResult> {
	const result: McpRegistrationResult = {
		created: [],
		updated: [],
		skipped: [],
		failed: [],
	};

	for (const target of registrationTargets(registration)) {
		const relativePath = target.segments.join('/');
		const filePath = path.join(workspaceRoot, ...target.segments);

		let raw: string | undefined;
		try {
			raw = await readFile(filePath, 'utf8');
		} catch (error) {
			const code = (error as NodeJS.ErrnoException).code;
			if (code !== 'ENOENT') {
				result.failed.push(relativePath);
				continue;
			}
		}

		if (raw === undefined) {
			try {
				await mkdir(path.dirname(filePath), { recursive: true });
				await writeFile(
					filePath,
					serializeConfig({
						mcpServers: { [MCP_SERVER_NAME]: target.entry },
					}),
					{ encoding: 'utf8', flag: 'wx' }
				);
				result.created.push(relativePath);
			} catch {
				// Lost a race with another writer or hit a permission error;
				// the next activation will reconcile.
				result.failed.push(relativePath);
			}
			continue;
		}

		let config: Record<string, unknown>;
		try {
			const parsed: unknown = JSON.parse(raw);
			if (!isPlainObject(parsed)) {
				result.failed.push(relativePath);
				continue;
			}
			config = parsed;
		} catch {
			// Malformed or comment-laden JSON: leave the user's file alone.
			result.failed.push(relativePath);
			continue;
		}

		const servers = config['mcpServers'];
		if (servers !== undefined && !isPlainObject(servers)) {
			result.failed.push(relativePath);
			continue;
		}
		const mcpServers = servers ?? {};
		if (entryMatches(mcpServers[MCP_SERVER_NAME], target.entry)) {
			result.skipped.push(relativePath);
			continue;
		} else {
			mcpServers[MCP_SERVER_NAME] = { ...target.entry };
		}

		config['mcpServers'] = mcpServers;
		try {
			await writeFile(filePath, serializeConfig(config), 'utf8');
			result.updated.push(relativePath);
		} catch {
			result.failed.push(relativePath);
		}
	}

	return result;
}

/**
 * Remove only Syntaxxed's current and previous preview entries from project MCP
 * configuration files. Other
 * servers and unrelated settings are preserved. Empty configuration shells
 * are intentionally retained to avoid deleting user-owned files.
 */
export async function removeMcpRegistrations(
	workspaceRoot: string
): Promise<McpRegistrationResult> {
	const result: McpRegistrationResult = {
		created: [],
		updated: [],
		skipped: [],
		failed: [],
	};

	for (const target of registrationTargets({
		url: 'http://127.0.0.1/disabled',
		authorizationHeader: 'Bearer disabled',
	})) {
		const relativePath = target.segments.join('/');
		const filePath = path.join(workspaceRoot, ...target.segments);
		let raw: string;
		try {
			raw = await readFile(filePath, 'utf8');
		} catch (error) {
			const code = (error as NodeJS.ErrnoException).code;
			if (code === 'ENOENT') {
				result.skipped.push(relativePath);
			} else {
				result.failed.push(relativePath);
			}
			continue;
		}

		let config: Record<string, unknown>;
		try {
			const parsed: unknown = JSON.parse(raw);
			if (!isPlainObject(parsed)) {
				result.failed.push(relativePath);
				continue;
			}
			config = parsed;
		} catch {
			result.failed.push(relativePath);
			continue;
		}

		const servers = config['mcpServers'];
		if (
			!isPlainObject(servers) ||
			!(MCP_SERVER_NAME in servers)
		) {
			result.skipped.push(relativePath);
			continue;
		}

		delete servers[MCP_SERVER_NAME];
		try {
			await writeFile(filePath, serializeConfig(config), 'utf8');
			result.updated.push(relativePath);
		} catch {
			result.failed.push(relativePath);
		}
	}

	return result;
}
