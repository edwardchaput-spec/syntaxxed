import { realpath } from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import {
	CONTEXT_DETAIL_LABELS,
	DEFAULT_SYNTAXXED_CONFIG,
	ensureAstParserReady,
	loadWorkspaceConfigs,
	normalizeContextDetail,
	prepareContent,
	redactSecrets,
	type ContextDetail,
	type SyntaxxedConfig,
} from './engine';
import { getExtensionSettings } from './extensionSettings';
import { getWorkspaceRoots } from './workspaceBridge';

export const SYNTAXXED_SCHEME = 'syntaxxed';

const PREVIEW_AUTHORITY = 'preview';

interface ResolvedWorkspaceFile {
	uri: vscode.Uri;
	relativePath: string;
	folder: vscode.WorkspaceFolder;
}

function normalizeRelativePath(value: string): string | null {
	if (value.includes('\0')) {
		return null;
	}

	const slashPath = value.replace(/\\/g, '/').replace(/^\/+/, '');
	if (/^[A-Za-z]:\//.test(slashPath)) {
		return null;
	}

	const normalized = path.posix.normalize(slashPath);
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

async function isLocalFileInsideWorkspace(
	folder: vscode.WorkspaceFolder,
	candidate: vscode.Uri
): Promise<boolean> {
	if (folder.uri.scheme !== 'file' || candidate.scheme !== 'file') {
		return true;
	}

	try {
		const [workspacePath, candidatePath] = await Promise.all([
			realpath(folder.uri.fsPath),
			realpath(candidate.fsPath),
		]);
		return isPathInside(workspacePath, candidatePath);
	} catch {
		return false;
	}
}

export function buildPreviewUri(
	relativePath: string,
	detail: ContextDetail
): vscode.Uri {
	const normalized = normalizeRelativePath(relativePath);
	if (!normalized) {
		throw new Error('Preview paths must stay within the open workspace.');
	}

	const encodedPath = normalized
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');

	return vscode.Uri.from({
		scheme: SYNTAXXED_SCHEME,
		authority: PREVIEW_AUTHORITY,
		path: `/${encodedPath}`,
		query: `detail=${encodeURIComponent(detail)}`,
	});
}

function relativePathFromUri(uri: vscode.Uri): string | null {
	try {
		const decoded = uri.path
			.replace(/^\/+/, '')
			.split('/')
			.map((segment) => decodeURIComponent(segment))
			.join('/');
		return normalizeRelativePath(decoded);
	} catch {
		return null;
	}
}

async function resolveWorkspaceFile(
	relativePath: string
): Promise<ResolvedWorkspaceFile | null> {
	const normalized = normalizeRelativePath(relativePath);
	if (!normalized) {
		return null;
	}

	const segments = normalized.split('/');
	for (const folder of vscode.workspace.workspaceFolders ?? []) {
		const candidate = vscode.Uri.joinPath(folder.uri, ...segments);

		try {
			const stat = await vscode.workspace.fs.stat(candidate);
			const isFile = (stat.type & vscode.FileType.File) !== 0;
			if (
				isFile &&
				(await isLocalFileInsideWorkspace(folder, candidate))
			) {
				return { uri: candidate, relativePath: normalized, folder };
			}
		} catch {
			// A later workspace root may contain the same relative path.
		}
	}

	return null;
}

function configForFolder(
	configs: ReadonlyMap<string, SyntaxxedConfig>,
	folder: vscode.WorkspaceFolder
): SyntaxxedConfig {
	return (
		configs.get(path.resolve(folder.uri.fsPath)) ?? {
			includeComments: DEFAULT_SYNTAXXED_CONFIG.includeComments,
			excludePatterns: [],
		}
	);
}

export class SyntaxxedPreviewProvider
	implements vscode.TextDocumentContentProvider, vscode.Disposable
{
	private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

	readonly onDidChange = this.onDidChangeEmitter.event;

	dispose(): void {
		this.onDidChangeEmitter.dispose();
	}

	refresh(uri: vscode.Uri): void {
		this.onDidChangeEmitter.fire(uri);
	}

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		if (uri.scheme !== SYNTAXXED_SCHEME || uri.authority !== PREVIEW_AUTHORITY) {
			throw new Error('Unsupported Syntaxxed preview URI.');
		}

		try {
			const relativePath = relativePathFromUri(uri);
			if (!relativePath) {
				throw new Error('The preview path is invalid.');
			}

			const detail = normalizeContextDetail(
				new URLSearchParams(uri.query).get('detail')
			);
			if (detail === 'outline') {
				await ensureAstParserReady();
			}

			const resolved = await resolveWorkspaceFile(relativePath);
			if (!resolved) {
				return `# Syntaxxed Preview\n\nCould not resolve workspace file: ${relativePath}`;
			}

			const raw = await vscode.workspace.fs.readFile(resolved.uri);
			const originalContent = new TextDecoder().decode(raw);
			const configs = await loadWorkspaceConfigs(getWorkspaceRoots());
			const config = configForFolder(configs, resolved.folder);
			const prepared = prepareContent(
				originalContent,
				resolved.relativePath,
				detail,
				{ preserveComments: config.includeComments }
			);
			const { redactedText, secretCount } = redactSecrets(
				prepared,
				getExtensionSettings().customRedactionRules
			);

			const header = [
				`// Syntaxxed preview - ${resolved.relativePath}`,
				`// Context detail: ${CONTEXT_DETAIL_LABELS[detail]}`,
				'// Read-only virtual document (prepared and redacted output)',
				secretCount > 0
					? `// Secrets redacted in preview: ${secretCount}`
					: '',
				'',
			]
				.filter(Boolean)
				.join('\n');

			return header + redactedText;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return `# Syntaxxed Preview Error\n\n${message}`;
		}
	}

	async openPreview(
		relativePath: string,
		detail: ContextDetail
	): Promise<void> {
		const normalized = normalizeRelativePath(relativePath);
		if (!normalized || !(await resolveWorkspaceFile(normalized))) {
			throw new Error('The requested preview file is outside the workspace.');
		}

		const normalizedDetail = normalizeContextDetail(detail);
		const uri = buildPreviewUri(normalized, normalizedDetail);
		this.refresh(uri);

		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document, {
			preview: true,
			viewColumn: vscode.ViewColumn.Beside,
		});
	}
}

export function registerSyntaxxedPreviewProvider(
	context: vscode.ExtensionContext
): SyntaxxedPreviewProvider {
	const provider = new SyntaxxedPreviewProvider();
	const registration = vscode.workspace.registerTextDocumentContentProvider(
		SYNTAXXED_SCHEME,
		provider
	);

	context.subscriptions.push(provider, registration);
	return provider;
}
