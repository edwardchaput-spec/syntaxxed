import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises';
import * as path from 'node:path';
import type { SyntaxxedConfig } from './config';
import {
	loadWorkspaceGitignoreFilters,
	type GitignoreFilter,
} from './gitignore';
import { looksBinary } from './ignore';
import type { ScannedFile } from './types';

/** Skip individual files larger than this to avoid blowing memory / context. */
const MAX_FILE_BYTES = 512 * 1024;

export interface ScanOptions {
	/** One or more local directories to scan. */
	workspaceRoots: readonly string[];
	/** Additional gitignore-style patterns applied to every root. */
	excludePatterns?: readonly string[];
	maxFileBytes?: number;
}

export interface ScanOutcome {
	files: ScannedFile[];
	skippedCount: number;
}

interface MutableScanOutcome {
	files: ScannedFile[];
	skippedCount: number;
}

function normalizeRelativePath(relativePath: string): string | null {
	if (relativePath.includes('\0')) {
		return null;
	}

	const slashPath = relativePath.replace(/\\/g, '/');
	if (path.posix.isAbsolute(slashPath)) {
		return null;
	}

	const normalized = path.posix.normalize(slashPath).replace(/^\/+/, '');
	if (
		normalized.length === 0 ||
		normalized === '.' ||
		normalized === '..' ||
		normalized.startsWith('../') ||
		path.posix.isAbsolute(normalized)
	) {
		return null;
	}

	return normalized;
}

function isPathInside(root: string, candidate: string): boolean {
	const relative = path.relative(root, candidate);
	return (
		relative.length > 0 &&
		relative !== '..' &&
		!relative.startsWith(`..${path.sep}`) &&
		!path.isAbsolute(relative)
	);
}

function normalizePathForComparison(filePath: string): string {
	const normalized = path.normalize(filePath);
	return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

async function scanDirectory(
	workspaceRoot: string,
	directoryPath: string,
	filter: GitignoreFilter,
	maxFileBytes: number,
	outcome: MutableScanOutcome
): Promise<void> {
	let entries;
	try {
		entries = await readdir(directoryPath, { withFileTypes: true });
	} catch {
		outcome.skippedCount++;
		return;
	}

	entries.sort((left, right) => left.name.localeCompare(right.name));
	for (const entry of entries) {
		const absolutePath = path.join(directoryPath, entry.name);
		const relativePath = normalizeRelativePath(
			path.relative(workspaceRoot, absolutePath)
		);
		if (!relativePath) {
			outcome.skippedCount++;
			continue;
		}

		if (entry.isSymbolicLink()) {
			outcome.skippedCount++;
			continue;
		}

		if (entry.isDirectory()) {
			if (!filter.ignores(`${relativePath}/`)) {
				await scanDirectory(
					workspaceRoot,
					absolutePath,
					filter,
					maxFileBytes,
					outcome
				);
			}
			continue;
		}

		if (!entry.isFile() || filter.ignores(relativePath)) {
			outcome.skippedCount++;
			continue;
		}

		try {
			const metadata = await stat(absolutePath);
			if (metadata.size > maxFileBytes) {
				outcome.skippedCount++;
				continue;
			}

			const raw = await readFile(absolutePath);
			const content = raw.toString('utf8');
			if (looksBinary(content)) {
				outcome.skippedCount++;
				continue;
			}

			outcome.files.push({
				uri: absolutePath,
				relativePath,
				content,
			});
		} catch {
			outcome.skippedCount++;
		}
	}
}

/**
 * Scan local workspace text files, filtering `.gitignore` rules, hardcoded
 * security exclusions, binaries, lockfiles, symlinks, and oversized files.
 */
export async function scanWorkspace(
	options: ScanOptions,
	configs?: ReadonlyMap<string, SyntaxxedConfig>
): Promise<ScanOutcome> {
	if (options.workspaceRoots.length === 0) {
		throw new Error('At least one workspace directory is required.');
	}

	const maxBytes = options.maxFileBytes ?? MAX_FILE_BYTES;
	if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
		throw new Error('maxFileBytes must be a positive integer.');
	}

	const workspaceRoots: string[] = [];
	for (const root of options.workspaceRoots) {
		const resolvedRoot = path.resolve(root);
		let rootStats;
		try {
			rootStats = await stat(resolvedRoot);
		} catch {
			throw new Error(`Workspace directory does not exist: ${resolvedRoot}`);
		}
		if (!rootStats.isDirectory()) {
			throw new Error(`Workspace path is not a directory: ${resolvedRoot}`);
		}
		workspaceRoots.push(resolvedRoot);
	}

	const gitignoreFilters = await loadWorkspaceGitignoreFilters(
		workspaceRoots,
		configs,
		options.excludePatterns
	);
	const outcome: MutableScanOutcome = { files: [], skippedCount: 0 };

	for (const workspaceRoot of workspaceRoots) {
		const filter = gitignoreFilters.get(workspaceRoot);
		if (!filter) {
			throw new Error(`Could not initialize ignore rules for ${workspaceRoot}.`);
		}
		await scanDirectory(
			workspaceRoot,
			workspaceRoot,
			filter,
			maxBytes,
			outcome
		);
	}

	outcome.files.sort((left, right) =>
		left.relativePath.localeCompare(right.relativePath)
	);
	return outcome;
}

export interface ScanWorkspaceFileOptions {
	/** Local workspace directory that owns the requested file. */
	workspaceRoot: string;
	/** Workspace-relative path supplied by a UI or agent boundary. */
	relativePath: string;
	/** Additional gitignore-style patterns applied to this root. */
	excludePatterns?: readonly string[];
	maxFileBytes?: number;
}

/**
 * Read one eligible workspace file without traversing the entire repository.
 * The same ignore, size, binary, and symlink policies used by `scanWorkspace`
 * are enforced at this narrower agent-facing boundary.
 */
export async function scanWorkspaceFile(
	options: ScanWorkspaceFileOptions,
	config?: SyntaxxedConfig
): Promise<ScannedFile | null> {
	const normalizedRelativePath = normalizeRelativePath(options.relativePath);
	if (!normalizedRelativePath) {
		throw new Error('File paths must stay within the selected workspace.');
	}

	const maxBytes = options.maxFileBytes ?? MAX_FILE_BYTES;
	if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
		throw new Error('maxFileBytes must be a positive integer.');
	}

	const resolvedRoot = path.resolve(options.workspaceRoot);
	let rootStats;
	try {
		rootStats = await stat(resolvedRoot);
	} catch {
		throw new Error(`Workspace directory does not exist: ${resolvedRoot}`);
	}
	if (!rootStats.isDirectory()) {
		throw new Error(`Workspace path is not a directory: ${resolvedRoot}`);
	}

	const configs = config
		? new Map<string, SyntaxxedConfig>([[resolvedRoot, config]])
		: undefined;
	const filters = await loadWorkspaceGitignoreFilters(
		[resolvedRoot],
		configs,
		options.excludePatterns ?? []
	);
	const filter = filters.get(resolvedRoot);
	if (!filter || filter.ignores(normalizedRelativePath)) {
		return null;
	}

	const realRoot = await realpath(resolvedRoot);
	const lexicalCandidate = path.resolve(
		realRoot,
		...normalizedRelativePath.split('/')
	);
	if (!isPathInside(realRoot, lexicalCandidate)) {
		throw new Error('File paths must stay within the selected workspace.');
	}

	try {
		const [candidateStats, realCandidate] = await Promise.all([
			lstat(lexicalCandidate),
			realpath(lexicalCandidate),
		]);
		if (
			candidateStats.isSymbolicLink() ||
			!candidateStats.isFile() ||
			candidateStats.size > maxBytes ||
			!isPathInside(realRoot, realCandidate) ||
			normalizePathForComparison(realCandidate) !==
				normalizePathForComparison(lexicalCandidate)
		) {
			return null;
		}

		const raw = await readFile(realCandidate);
		const content = raw.toString('utf8');
		if (looksBinary(content)) {
			return null;
		}

		return {
			uri: realCandidate,
			relativePath: normalizedRelativePath,
			content,
		};
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		if (code === 'ENOENT' || code === 'ENOTDIR' || code === 'EACCES') {
			return null;
		}
		throw error;
	}
}
