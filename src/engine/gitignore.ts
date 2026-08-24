import { readFile, readdir } from 'node:fs/promises';
import * as path from 'node:path';
import ignore, { type Ignore } from 'ignore';
import {
	hasIgnoredDirectory,
	isBinaryExtension,
	isIgnoredFilename,
} from './ignore';

/** Security exclusions applied before workspace ignore rules. */
const HARD_IGNORED_DIRECTORY_NAMES = new Set([
	'.git',
	'.gnupg',
	'.ssh',
	'.aws',
	'.azure',
	'.docker',
	'.kube',
	'.terraform',
	'node_modules',
	'dist',
	'out',
]);

const HARD_IGNORED_FILENAMES = new Set([
	'.env',
	'.npmrc',
	'.pypirc',
	'.netrc',
	'.vault-token',
	'.mcp.json',
	'.DS_Store',
	'Thumbs.db',
	'credentials.json',
	'mcp.json',
	'service-account.json',
	'serviceAccount.json',
	'id_rsa',
	'id_dsa',
	'id_ecdsa',
	'id_ed25519',
]);

const SENSITIVE_FILE_EXTENSIONS = new Set([
	'.key',
	'.pem',
	'.p12',
	'.pfx',
	'.jks',
	'.keystore',
]);

/** Security exclusions that workspace rules cannot override. */
const HARD_IGNORE_PATTERNS = [
	'.git',
	'.git/**',
	'.gnupg',
	'.gnupg/**',
	'.ssh',
	'.ssh/**',
	'.aws',
	'.aws/**',
	'.azure',
	'.azure/**',
	'.docker',
	'.docker/**',
	'.kube',
	'.kube/**',
	'.terraform',
	'.terraform/**',
	'node_modules',
	'node_modules/**',
	'dist',
	'dist/**',
	'out',
	'out/**',
	'.env',
	'.env.*',
	'**/.env',
	'**/.env.*',
	'*.pem',
	'*.key',
	'*.p12',
	'*.pfx',
	'*.jks',
	'*.keystore',
	'**/credentials.json',
	'**/credentials.*.json',
	'**/service-account.json',
	'**/service-account.*.json',
	'**/serviceAccount.json',
	'**/serviceAccount.*.json',
	'**/.npmrc',
	'**/.pypirc',
	'**/.netrc',
	'**/.vault-token',
	'**/.mcp.json',
	'**/mcp.json',
	'**/terraform.tfstate',
	'**/terraform.tfstate.*',
	'**/*.tfvars',
	'**/*.auto.tfvars',
	'**/id_rsa',
	'**/id_dsa',
	'**/id_ecdsa',
	'**/id_ed25519',
];

/**
 * Per-workspace-root gitignore rule sets (root + nested `.gitignore` files).
 */
export class GitignoreFilter {
	private readonly nested: Map<string, Ignore> = new Map();

	constructor(
		readonly workspaceRoot: string,
		private readonly rootIgnore: Ignore
	) {}

	addNestedRules(dirPath: string, gitignoreContent: string): void {
		const normalized = normalizeRelativePath(dirPath);
		if (!normalized || normalized === '.') {
			return;
		}
		this.nested.set(normalized, createNestedIgnore(gitignoreContent));
	}

	/**
	 * True when the relative path (forward slashes, workspace-relative) must be
	 * excluded from scanning and the UI.
	 */
	ignores(relativePath: string): boolean {
		const normalized = normalizeRelativePath(relativePath);

		if (isHardcodedIgnored(normalized)) {
			return true;
		}

		if (this.rootIgnore.ignores(normalized)) {
			return true;
		}

		// Nested `.gitignore` files apply to files under their directory.
		const parts = normalized.split('/');
		for (let i = parts.length - 1; i >= 0; i--) {
			const dirPath = parts.slice(0, i).join('/');
			const nestedIg = this.nested.get(dirPath);
			if (!nestedIg) {
				continue;
			}
			const localPath = parts.slice(i).join('/');
			if (localPath && nestedIg.ignores(localPath)) {
				return true;
			}
		}

		return false;
	}
}

function normalizeRelativePath(relativePath: string): string {
	return relativePath.replace(/\\/g, '/').replace(/^\//, '');
}

function isHardcodedIgnored(relativePath: string): boolean {
	const normalized = normalizeRelativePath(relativePath);
	const segments = normalized.split('/').filter(Boolean);
	const fileName = segments[segments.length - 1] ?? '';

	if (segments.some((segment) => HARD_IGNORED_DIRECTORY_NAMES.has(segment))) {
		return true;
	}

	if (HARD_IGNORED_FILENAMES.has(fileName)) {
		return true;
	}

	if (fileName.startsWith('.env')) {
		return true;
	}

	if (
		fileName === 'terraform.tfstate' ||
		fileName.startsWith('terraform.tfstate.') ||
		fileName.endsWith('.tfvars') ||
		fileName.endsWith('.auto.tfvars')
	) {
		return true;
	}

	if (
		/^credentials(?:\..+)?\.json$/i.test(fileName) ||
		/^service[-_]?account(?:\..+)?\.json$/i.test(fileName)
	) {
		return true;
	}

	if (SENSITIVE_FILE_EXTENSIONS.has(path.extname(fileName).toLowerCase())) {
		return true;
	}

	if (hasIgnoredDirectory(normalized)) {
		return true;
	}

	if (isBinaryExtension(normalized)) {
		return true;
	}

	if (isIgnoredFilename(fileName)) {
		return true;
	}

	return false;
}

function createRootIgnore(
	gitignoreContent?: string,
	customIgnores?: string[]
): Ignore {
	const ig = ignore({ allowRelativePaths: true });
	ig.add(HARD_IGNORE_PATTERNS.join('\n'));
	if (customIgnores?.length) {
		ig.add(customIgnores.join('\n'));
	}
	if (gitignoreContent) {
		ig.add(gitignoreContent);
	}
	return ig;
}

function createNestedIgnore(gitignoreContent: string): Ignore {
	return ignore({ allowRelativePaths: true }).add(gitignoreContent);
}

async function readTextFile(filePath: string): Promise<string | undefined> {
	try {
		return await readFile(filePath, 'utf8');
	} catch {
		return undefined;
	}
}

async function loadNestedGitignoreRules(
	rootPath: string,
	currentPath: string,
	filter: GitignoreFilter
): Promise<void> {
	let entries;
	try {
		entries = await readdir(currentPath, { withFileTypes: true });
	} catch {
		return;
	}

	entries.sort((left, right) => left.name.localeCompare(right.name));
	for (const entry of entries) {
		if (!entry.isDirectory() || entry.isSymbolicLink()) {
			continue;
		}

		const directoryPath = path.join(currentPath, entry.name);
		const relativeDirectory = normalizeRelativePath(
			path.relative(rootPath, directoryPath)
		);
		if (filter.ignores(`${relativeDirectory}/`)) {
			continue;
		}

		const gitignoreContent = await readTextFile(
			path.join(directoryPath, '.gitignore')
		);
		if (gitignoreContent) {
			filter.addNestedRules(relativeDirectory, gitignoreContent);
		}

		await loadNestedGitignoreRules(rootPath, directoryPath, filter);
	}
}

/**
 * Load root and nested `.gitignore` rules for a workspace folder.
 */
export async function loadGitignoreFilter(
	workspaceRoot: string,
	customIgnores: string[] = []
): Promise<GitignoreFilter> {
	const rootPath = path.resolve(workspaceRoot);
	const rootGitignorePath = path.join(rootPath, '.gitignore');
	const rootContent = await readTextFile(rootGitignorePath);
	const rootIgnore = createRootIgnore(rootContent, customIgnores);

	const filter = new GitignoreFilter(rootPath, rootIgnore);

	await loadNestedGitignoreRules(rootPath, rootPath, filter);

	return filter;
}

/**
 * Load gitignore filters for every folder in the open workspace.
 * `configs` maps workspace roots to Syntaxxed exclusion settings.
 */
export async function loadWorkspaceGitignoreFilters(
	workspaceRoots: readonly string[],
	configs?: ReadonlyMap<string, { excludePatterns: string[] }>,
	additionalIgnorePatterns: readonly string[] = []
): Promise<Map<string, GitignoreFilter>> {
	const map = new Map<string, GitignoreFilter>();

	for (const workspaceRoot of workspaceRoots) {
		const rootPath = path.resolve(workspaceRoot);
		const customIgnores =
			configs?.get(rootPath)?.excludePatterns ?? [];
		map.set(
			rootPath,
			await loadGitignoreFilter(rootPath, [
				...customIgnores,
				...additionalIgnorePatterns,
			])
		);
	}

	return map;
}
