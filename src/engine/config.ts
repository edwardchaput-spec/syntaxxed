import { readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

export const CONFIG_FILENAME = 'syntaxxed.json';
export const TOKEN_BUDGET_THRESHOLD = 30_000;
export const DEFAULT_INPUT_COST_PER_MILLION = 3;

const MAX_CUSTOM_IGNORE_COUNT = 256;
const MAX_CUSTOM_IGNORE_LENGTH = 512;

export interface SyntaxxedConfig {
	includeComments: boolean;
	excludePatterns: string[];
}

export interface ConfigFileCreationResult {
	filePath: string;
	created: boolean;
}

export const DEFAULT_SYNTAXXED_CONFIG: SyntaxxedConfig = {
	includeComments: false,
	excludePatterns: [],
};

function createDefaultConfig(): SyntaxxedConfig {
	return {
		includeComments: DEFAULT_SYNTAXXED_CONFIG.includeComments,
		excludePatterns: [],
	};
}

function normalizeCustomIgnores(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter((entry): entry is string => typeof entry === 'string')
		.map((entry) => entry.trim())
		.filter(
			(entry) =>
				entry.length > 0 && entry.length <= MAX_CUSTOM_IGNORE_LENGTH
		)
		.slice(0, MAX_CUSTOM_IGNORE_COUNT);
}

function normalizeConfig(raw: unknown): SyntaxxedConfig {
	if (!raw || typeof raw !== 'object') {
		return createDefaultConfig();
	}

	const candidate = raw as Record<string, unknown>;
	return {
		includeComments:
			typeof candidate['include_comments'] === 'boolean'
				? candidate['include_comments']
				: typeof candidate['preserve_comments'] === 'boolean'
					? candidate['preserve_comments']
					: DEFAULT_SYNTAXXED_CONFIG.includeComments,
		excludePatterns: normalizeCustomIgnores(
			candidate['exclude'] ?? candidate['custom_ignores']
		),
	};
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'code' in error;
}

export function getDefaultConfigFileContent(): string {
	return (
		JSON.stringify(
			{
				include_comments: false,
				exclude: [],
			},
			null,
			2
		) + '\n'
	);
}

export async function loadConfigForRoot(
	workspaceRoot: string
): Promise<SyntaxxedConfig> {
	const configPath = path.join(path.resolve(workspaceRoot), CONFIG_FILENAME);
	try {
		const content = await readFile(configPath, 'utf8');
		const parsed: unknown = JSON.parse(content);
		return normalizeConfig(parsed);
	} catch (error) {
		if (isNodeError(error) && error.code === 'ENOENT') {
			return createDefaultConfig();
		}

		console.warn(`Syntaxxed: invalid workspace configuration; using defaults.`, error);
		return createDefaultConfig();
	}
}

export async function loadWorkspaceConfigs(
	workspaceRoots: readonly string[]
): Promise<Map<string, SyntaxxedConfig>> {
	const configs = new Map<string, SyntaxxedConfig>();

	for (const root of workspaceRoots) {
		const resolvedRoot = path.resolve(root);
		configs.set(resolvedRoot, await loadConfigForRoot(resolvedRoot));
	}

	return configs;
}

export function getPrimaryWorkspaceConfig(
	configs: ReadonlyMap<string, SyntaxxedConfig>,
	workspaceRoots: readonly string[]
): SyntaxxedConfig {
	const primaryRoot = workspaceRoots[0];
	return primaryRoot
		? configs.get(path.resolve(primaryRoot)) ?? createDefaultConfig()
		: createDefaultConfig();
}

export async function createWorkspaceConfigFile(
	workspaceRoot: string
): Promise<ConfigFileCreationResult> {
	const filePath = path.join(path.resolve(workspaceRoot), CONFIG_FILENAME);

	try {
		await writeFile(filePath, getDefaultConfigFileContent(), {
			encoding: 'utf8',
			flag: 'wx',
		});
		return { filePath, created: true };
	} catch (error) {
		if (isNodeError(error) && error.code === 'EEXIST') {
			return { filePath, created: false };
		}
		throw error;
	}
}
