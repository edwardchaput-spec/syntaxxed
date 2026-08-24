export type ContextDetail = 'outline' | 'logic' | 'source';

export const CONTEXT_DETAIL_LABELS: Record<ContextDetail, string> = {
	outline: 'Outline',
	logic: 'Logic',
	source: 'Source',
};

const CONTEXT_DETAILS = new Set<ContextDetail>([
	'outline',
	'logic',
	'source',
]);

export const DEFAULT_CONTEXT_DETAIL: ContextDetail = 'logic';

/**
 * Normalizes values received from UI, CLI, configuration, and URI boundaries.
 * The previous public-preview names remain accepted so a saved task or
 * automation does not silently select the wrong detail level.
 */
export function normalizeContextDetail(value: unknown): ContextDetail {
	const cleaned = typeof value === 'string' ? value.trim().toLowerCase() : '';
	if (CONTEXT_DETAILS.has(cleaned as ContextDetail)) {
		return cleaned as ContextDetail;
	}
	switch (cleaned) {
		case 'axe':
		case 'architecture':
			return 'outline';
		case 'prune':
		case 'debugging':
			return 'logic';
		case 'preserve':
		case 'full-context':
			return 'source';
		default:
			return DEFAULT_CONTEXT_DETAIL;
	}
}

export interface ScannedFile {
	/** Absolute filesystem path. */
	uri: string;
	/** Path relative to the workspace root. */
	relativePath: string;
	content: string;
}

export interface PreparedFile {
	relativePath: string;
	originalContent: string;
	preparedContent: string;
	originalTokens: number;
	preparedTokens: number;
}

export interface ContextBuildResult {
	files: PreparedFile[];
	fileCount: number;
	skippedCount: number;
	originalTokens: number;
	preparedTokens: number;
	tokensSaved: number;
	secretsRedacted: number;
	/** Concatenated payload ready for an LLM context window. */
	payload: string;
}
