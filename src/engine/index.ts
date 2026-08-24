import * as path from 'node:path';
import {
	buildPayload,
	prepareContent,
	type ContextBuildOptions,
} from './contextBuilder';
import {
	getPrimaryWorkspaceConfig,
	loadWorkspaceConfigs,
	type SyntaxxedConfig,
} from './config';
import {
	scanWorkspace,
	scanWorkspaceFile,
	type ScanOptions,
} from './scanner';
import {
	redactSecrets,
	type CustomRedactionRule,
} from './secretScanner';
import { estimateTokens } from './tokens';
import type {
	ContextBuildResult,
	ContextDetail,
	PreparedFile,
} from './types';
import {
	CONTEXT_DETAIL_LABELS,
	DEFAULT_CONTEXT_DETAIL,
} from './types';
import { ensureAstParserReady } from './sourceTransformer';
import {
	scoreFilesForIntent,
	type IntentScoreOptions,
} from './intentScorer';
import {
	broadcastTelemetry,
	type TelemetrySource,
} from './telemetry';

export type {
	ScannedFile,
	PreparedFile,
	ContextBuildResult,
	ContextDetail,
} from './types';
export {
	CONTEXT_DETAIL_LABELS,
	DEFAULT_CONTEXT_DETAIL,
	normalizeContextDetail,
} from './types';
export { estimateTokens } from './tokens';
export {
	broadcastTelemetry,
	type TelemetrySource,
	type TelemetryStats,
} from './telemetry';
export {
	prepareContent,
	buildPayload,
	type ContextBuildOptions,
} from './contextBuilder';
export { scanWorkspace, scanWorkspaceFile } from './scanner';
export { redactSecrets } from './secretScanner';
export { loadWorkspaceGitignoreFilters } from './gitignore';
export {
	ensureAstParserReady,
	extractSymbols,
	initializeAstParser,
	isAstParserReady,
	buildSourceOutline,
	buildSourceOutlineStrict,
	removeCodeComments,
	supportsStructuralOutline,
} from './sourceTransformer';
export {
	scoreFilesForIntent,
	type IntentMatch,
	type IntentScoreOptions,
} from './intentScorer';
export {
	CONFIG_FILENAME,
	DEFAULT_INPUT_COST_PER_MILLION,
	DEFAULT_SYNTAXXED_CONFIG,
	TOKEN_BUDGET_THRESHOLD,
	createWorkspaceConfigFile,
	getDefaultConfigFileContent,
	loadConfigForRoot,
	loadWorkspaceConfigs,
	getPrimaryWorkspaceConfig,
	type ConfigFileCreationResult,
	type SyntaxxedConfig,
} from './config';
export {
	normalizeCustomRedactionRules,
	type CustomRedactionRule,
	type CustomRedactionRuleSet,
} from './secretScanner';
export {
	MCP_SERVER_NAME,
	ensureMcpRegistrations,
	removeMcpRegistrations,
	type McpHttpRegistration,
	type McpRegistrationResult,
} from './guardrails';

export interface BuildWorkspaceContextOptions extends ScanOptions {
	/** Runtime surface responsible for this context-build telemetry event. */
	source: TelemetrySource;
	/** When set, only these relative paths are included in the payload/summary. */
	includePaths?: ReadonlyArray<string>;
	/** Detail level controlling structural and text transformations. */
	detail?: ContextDetail;
	/** Pre-loaded workspace configurations. */
	configs?: ReadonlyMap<string, SyntaxxedConfig>;
	/** Build options derived from syntaxxed.json. */
	buildOptions?: ContextBuildOptions;
	/** Validated custom credential patterns applied at the export boundary. */
	customRedactionRules?: readonly CustomRedactionRule[];
	/** Optional task description used to select the most relevant files. */
	intent?: string;
	intentScoreOptions?: IntentScoreOptions;
}

export interface BuildWorkspaceFileContextOptions {
	/** Runtime surface responsible for this context-build telemetry event. */
	source: TelemetrySource;
	/** Exactly one local workspace root owns the requested file. */
	workspaceRoot: string;
	/** Normalized workspace-relative path to read. */
	relativePath: string;
	detail?: ContextDetail;
	config?: SyntaxxedConfig;
	buildOptions?: ContextBuildOptions;
	customRedactionRules?: readonly CustomRedactionRule[];
}

function toPreparedFile(
	file: { relativePath: string; content: string },
	detail: ContextDetail,
	buildOptions: ContextBuildOptions = {}
): PreparedFile {
	const preparedContent = prepareContent(
		file.content,
		file.relativePath,
		detail,
		buildOptions
	);
	return {
		relativePath: file.relativePath,
		originalContent: file.content,
		preparedContent,
		originalTokens: estimateTokens(file.content),
		preparedTokens: estimateTokens(preparedContent),
	};
}

function buildResult(
	files: readonly PreparedFile[],
	skippedCount: number,
	detail: ContextDetail = DEFAULT_CONTEXT_DETAIL,
	secretsRedacted = 0
): ContextBuildResult {
	const originalTokens = files.reduce((sum, f) => sum + f.originalTokens, 0);
	const preparedTokens = files.reduce((sum, f) => sum + f.preparedTokens, 0);
	const tokensSaved = Math.max(0, originalTokens - preparedTokens);
	const percentSaved =
		originalTokens > 0 ? Math.round((tokensSaved / originalTokens) * 100) : 0;

	return {
		files: [...files],
		fileCount: files.length,
		skippedCount,
		originalTokens,
		preparedTokens,
		tokensSaved,
		secretsRedacted,
		payload: buildPayload(files, {
			detailLabel: CONTEXT_DETAIL_LABELS[detail],
			fileCount: files.length,
			originalTokens,
			preparedTokens,
			percentSaved,
			secretsRedacted,
		}),
	};
}

/**
 * Redact secrets from prepared file bodies and return updated files plus total count.
 */
export function applySecretRedaction(
	files: ReadonlyArray<PreparedFile>,
	customRules: readonly CustomRedactionRule[] = []
): { files: PreparedFile[]; secretsRedacted: number } {
	let secretsRedacted = 0;
	const redactedFiles = files.map((file) => {
		const contentResult = redactSecrets(file.preparedContent, customRules);
		const pathResult = redactSecrets(file.relativePath, customRules);
		secretsRedacted += contentResult.secretCount + pathResult.secretCount;
		return {
			...file,
			relativePath: pathResult.redactedText,
			preparedContent: contentResult.redactedText,
			preparedTokens: estimateTokens(contentResult.redactedText),
		};
	});
	return { files: redactedFiles, secretsRedacted };
}

/**
 * Apply secret redaction and build a clipboard-ready payload.
 */
export function finalizeForExport(
	files: ReadonlyArray<PreparedFile>,
	skippedCount: number,
	detail: ContextDetail = DEFAULT_CONTEXT_DETAIL,
	customRules: readonly CustomRedactionRule[] = []
): ContextBuildResult {
	const { files: redactedFiles, secretsRedacted } = applySecretRedaction(
		files,
		customRules
	);
	return buildResult(redactedFiles, skippedCount, detail, secretsRedacted);
}

function buildOptionsFromConfig(config: SyntaxxedConfig): ContextBuildOptions {
	return { preserveComments: config.includeComments };
}

function selectFiles(
	files: readonly PreparedFile[],
	includePaths?: ReadonlyArray<string>
): PreparedFile[] {
	if (includePaths === undefined) {
		return [...files];
	}

	const included = new Set(includePaths);
	return files.filter((file) => included.has(file.relativePath));
}

/**
 * Scan local workspace roots, prepare each eligible file, and return a
 * summary plus a clipboard-ready LLM payload.
 */
export async function buildWorkspaceContext(
	options: BuildWorkspaceContextOptions
): Promise<ContextBuildResult> {
	const {
		source,
		includePaths,
		detail = DEFAULT_CONTEXT_DETAIL,
		configs: providedConfigs,
		buildOptions: providedBuildOptions,
		customRedactionRules: providedCustomRedactionRules,
		intent,
		intentScoreOptions,
		...scanOptions
	} = options;

	if (detail !== 'source' || intent?.trim()) {
		await ensureAstParserReady();
	}

	const configs =
		providedConfigs ??
		(await loadWorkspaceConfigs(scanOptions.workspaceRoots));
	const primaryConfig = getPrimaryWorkspaceConfig(
		configs,
		scanOptions.workspaceRoots
	);
	const buildOptions =
		providedBuildOptions ?? buildOptionsFromConfig(primaryConfig);
	const customRedactionRules = providedCustomRedactionRules ?? [];

	const { files, skippedCount } = await scanWorkspace(scanOptions, configs);

	const prepared: PreparedFile[] = files.map((file) =>
		toPreparedFile(file, detail, buildOptions)
	);
	const intentPaths = intent?.trim()
		? scoreFilesForIntent(intent, prepared, intentScoreOptions).map(
				(match) => match.path
		  )
		: undefined;
	const selectedPaths = includePaths ?? intentPaths;

	const result = finalizeForExport(
		selectFiles(prepared, selectedPaths),
		skippedCount,
		detail,
		customRedactionRules
	);

	void broadcastTelemetry({
		tokensSaved: result.tokensSaved,
		secretsRedacted: result.secretsRedacted,
		source,
	});

	return result;
}

/**
 * Build context for one explicitly requested file without rescanning the repository.
 * This is the preferred boundary for agent tools because the workspace root is
 * fixed and all scanner safety rules are still applied.
 */
export async function buildWorkspaceFileContext(
	options: BuildWorkspaceFileContextOptions
): Promise<ContextBuildResult> {
	const {
		source,
		workspaceRoot,
		relativePath,
		detail = DEFAULT_CONTEXT_DETAIL,
		config: providedConfig,
		buildOptions: providedBuildOptions,
		customRedactionRules = [],
	} = options;

	if (detail !== 'source') {
		await ensureAstParserReady();
	}

	const configs = providedConfig
		? new Map<string, SyntaxxedConfig>([
				[path.resolve(workspaceRoot), providedConfig],
		  ])
		: await loadWorkspaceConfigs([workspaceRoot]);
	const config = getPrimaryWorkspaceConfig(configs, [workspaceRoot]);
	const file = await scanWorkspaceFile(
		{ workspaceRoot, relativePath },
		config
	);
	if (!file) {
		return buildResult([], 1, detail);
	}

	const prepared = toPreparedFile(
		file,
		detail,
		detail === 'outline'
			? {
					...(providedBuildOptions ?? buildOptionsFromConfig(config)),
					strictOutline: true,
			  }
			: providedBuildOptions ?? buildOptionsFromConfig(config)
	);
	const result = finalizeForExport(
		[prepared],
		0,
		detail,
		customRedactionRules
	);

	void broadcastTelemetry({
		tokensSaved: result.tokensSaved,
		secretsRedacted: result.secretsRedacted,
		source,
	});
	return result;
}

/**
 * Build a payload/summary from scanned originals, optionally filtered
 * to selected relative paths and rebuilt with the selected detail level.
 */
export function buildSelectionContext(
	files: ReadonlyArray<PreparedFile>,
	includePaths?: ReadonlyArray<string>,
	skippedCount = 0,
	detail: ContextDetail = DEFAULT_CONTEXT_DETAIL,
	buildOptions: ContextBuildOptions = {},
	customRedactionRules: readonly CustomRedactionRule[] = []
): ContextBuildResult {
	const recomputed = selectFiles(files, includePaths).map((file) =>
		toPreparedFile(
			{ relativePath: file.relativePath, content: file.originalContent },
			detail,
			buildOptions
		)
	);

	return finalizeForExport(
		recomputed,
		skippedCount,
		detail,
		customRedactionRules
	);
}
