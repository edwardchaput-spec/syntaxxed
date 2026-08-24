import * as path from 'node:path';
import { extractSymbols } from './sourceTransformer';
import type { PreparedFile } from './types';

export interface IntentScoreOptions {
	/** Maximum number of files to return (default 10). */
	maxResults?: number;
	/** Minimum score a file needs to be included (default 5). */
	minScore?: number;
}

/** A matched file plus a short human-readable explanation of the match. */
export interface IntentMatch {
	path: string;
	reason: string;
}

const DEFAULT_MAX_RESULTS = 10;
const DEFAULT_MIN_SCORE = 5;

const SCORE_BASENAME_EXACT = 15;
const SCORE_BASENAME_PARTIAL = 10;
const SCORE_PATH_PARTIAL = 5;
const SCORE_SYMBOL_WORD = 8;
const SCORE_SYMBOL_PARTIAL = 6;

/**
 * Symbols per file, keyed by the PreparedFile object itself. Entries are
 * garbage-collected automatically when a workspace rescan replaces the files.
 */
const symbolCache = new WeakMap<PreparedFile, string[]>();

/** Split a free-text query into lowercase search words. */
function tokenizeQuery(query: string): string[] {
	return query
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((word) => word.length >= 2);
}

/** Split an identifier into lowercase word parts (camelCase, snake_case, kebab-case). */
function splitIdentifier(identifier: string): string[] {
	return identifier
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.split(/[^a-zA-Z0-9]+/)
		.map((part) => part.toLowerCase())
		.filter((part) => part.length >= 2);
}

function getSymbols(file: PreparedFile): string[] {
	let symbols = symbolCache.get(file);
	if (!symbols) {
		symbols = extractSymbols(file.originalContent, file.relativePath);
		symbolCache.set(file, symbols);
	}
	return symbols;
}

interface FileScore {
	score: number;
	reason: string;
}

function scoreFile(
	words: ReadonlyArray<string>,
	file: PreparedFile
): FileScore {
	const normalizedPath = file.relativePath.toLowerCase().replace(/\\/g, '/');
	const baseName = path
		.basename(normalizedPath, path.extname(normalizedPath))
		.toLowerCase();
	const baseWords = splitIdentifier(baseName);

	const symbols = getSymbols(file);
	const symbolWordIndex = new Map<string, string>();
	for (const symbol of symbols) {
		for (const part of splitIdentifier(symbol)) {
			if (!symbolWordIndex.has(part)) {
				symbolWordIndex.set(part, symbol);
			}
		}
	}

	let score = 0;
	let bestReason = '';
	let bestReasonScore = 0;

	for (const word of words) {
		let wordScore = 0;
		let wordReason = '';

		if (baseName === word) {
			wordScore = SCORE_BASENAME_EXACT;
			wordReason = 'Matches file name';
		} else if (baseWords.includes(word) || baseName.includes(word)) {
			wordScore = SCORE_BASENAME_PARTIAL;
			wordReason = 'Matches file name';
		} else if (normalizedPath.includes(word)) {
			wordScore = SCORE_PATH_PARTIAL;
			wordReason = 'Matches folder path';
		}

		const exactSymbol = symbolWordIndex.get(word);
		if (exactSymbol && SCORE_SYMBOL_WORD > wordScore) {
			wordScore = SCORE_SYMBOL_WORD;
			wordReason = `Found symbol: ${exactSymbol}`;
		} else if (wordScore < SCORE_SYMBOL_PARTIAL) {
			const partialSymbol = symbols.find((s) =>
				s.toLowerCase().includes(word)
			);
			if (partialSymbol) {
				wordScore = SCORE_SYMBOL_PARTIAL;
				wordReason = `Found symbol: ${partialSymbol}`;
			}
		}

		score += wordScore;
		if (wordScore > bestReasonScore) {
			bestReasonScore = wordScore;
			bestReason = wordReason;
		}
	}

	return { score, reason: bestReason };
}

/**
 * Rank workspace files against a free-text intent query using path/name
 * matching and Tree-sitter symbol matching. Returns the most relevant files
 * (best match first), each with a short reason explaining the match.
 */
export function scoreFilesForIntent(
	query: string,
	files: ReadonlyArray<PreparedFile>,
	options: IntentScoreOptions = {}
): IntentMatch[] {
	const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
	const minScore = options.minScore ?? DEFAULT_MIN_SCORE;

	const words = tokenizeQuery(query);
	if (words.length === 0) {
		return [];
	}

	return files
		.map((file) => {
			const { score, reason } = scoreFile(words, file);
			return { path: file.relativePath, score, reason };
		})
		.filter((entry) => entry.score >= minScore)
		.sort((a, b) => b.score - a.score)
		.slice(0, maxResults)
		.map(({ path: matchPath, reason }) => ({ path: matchPath, reason }));
}
