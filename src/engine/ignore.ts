import * as path from 'node:path';

/** Directory / path segments that should never be scanned. */
export const IGNORED_DIRECTORY_NAMES = new Set([
	'node_modules',
	'.git',
	'.svn',
	'.hg',
	'.vscode-test',
	'dist',
	'out',
	'build',
	'coverage',
	'.next',
	'.nuxt',
	'.turbo',
	'.cache',
	'__pycache__',
	'.pytest_cache',
	'.mypy_cache',
	'vendor',
	'target', // Rust / Java
	'bin',
	'obj',
]);

/** File extensions treated as binary / non-text. */
export const BINARY_EXTENSIONS = new Set([
	'.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp',
	'.woff', '.woff2', '.ttf', '.eot', '.otf',
	'.mp3', '.mp4', '.wav', '.ogg', '.webm', '.avi', '.mov',
	'.pdf', '.zip', '.gz', '.tar', '.rar', '.7z', '.bz2',
	'.exe', '.dll', '.so', '.dylib', '.o', '.a', '.lib',
	'.wasm', '.bin', '.dat', '.db', '.sqlite', '.sqlite3',
	'.class', '.jar', '.pyc', '.pyo', '.pyd',
	'.map', // source maps are huge and rarely useful as LLM context
	'.lock', // lockfiles are noisy; package metadata is enough
]);

/** Exact filenames to skip. */
export const IGNORED_FILENAMES = new Set([
	'package-lock.json',
	'yarn.lock',
	'pnpm-lock.yaml',
	'bun.lockb',
	'composer.lock',
	'Cargo.lock',
	'Gemfile.lock',
	'.DS_Store',
	'Thumbs.db',
]);

export function isIgnoredFilename(fileName: string): boolean {
	return IGNORED_FILENAMES.has(fileName);
}

export function isBinaryExtension(filePath: string): boolean {
	const ext = path.extname(filePath).toLowerCase();
	return BINARY_EXTENSIONS.has(ext);
}

/**
 * True if any path segment is an ignored directory name.
 */
export function hasIgnoredDirectory(relativePath: string): boolean {
	const segments = relativePath.split(/[/\\]/).filter(Boolean);
	return segments.some((segment) => IGNORED_DIRECTORY_NAMES.has(segment));
}

/**
 * Heuristic: content with a NUL byte is almost certainly binary.
 */
export function looksBinary(content: string): boolean {
	return content.includes('\0');
}
