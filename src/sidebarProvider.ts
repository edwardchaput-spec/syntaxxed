import * as vscode from 'vscode';
import {
	buildSelectionContext,
	buildWorkspaceContext,
	DEFAULT_SYNTAXXED_CONFIG,
	ensureAstParserReady,
	estimateTokens,
	getPrimaryWorkspaceConfig,
	isAstParserReady,
	loadWorkspaceConfigs,
	normalizeContextDetail,
	prepareContent,
	scoreFilesForIntent,
	type ContextDetail,
	type PreparedFile,
	type SyntaxxedConfig,
} from './engine';
import {
	getExtensionSettings,
	type SyntaxxedExtensionSettings,
} from './extensionSettings';
import type { SyntaxxedPreviewProvider } from './previewProvider';
import type { StatsManager } from './statsManager';
import { getWorkspaceRoots } from './workspaceBridge';

const MAX_INTENT_LENGTH = 512;
const MAX_RELATIVE_PATH_LENGTH = 4_096;
const MAX_REQUESTED_PATHS = 10_000;

export interface SidebarFileRow {
	relativePath: string;
	originalTokens: number;
	preparedTokens: number;
	included: boolean;
}

type WebviewToExtension =
	| { type: 'ready' }
	| { type: 'refresh' }
	| { type: 'toggleFile'; relativePath: string; included: boolean }
	| { type: 'setAll'; included: boolean }
	| { type: 'detailChange'; detail: ContextDetail }
	| { type: 'build'; paths: string[]; detail: ContextDetail }
	| { type: 'preview'; relativePath: string; detail: ContextDetail }
	| { type: 'searchIntent'; query: string }
	| { type: 'resetStats' }
	| { type: 'openRedactionSettings' };

type ExtensionToWebview =
	| {
			type: 'status';
			state: 'loading' | 'idle' | 'error' | 'success';
			message?: string;
	  }
	| {
			type: 'stats';
			sessionOriginal: number;
			sessionPrepared: number;
			sessionSaved: number;
			sessionBuildCount: number;
			sessionSecrets: number;
			workspaceSaved: number;
			lifetimeSaved: number;
			inputCostPerMillionTokens: number;
			customRedactionRuleCount: number;
			invalidCustomRedactionRuleCount: number;
	  }
	| { type: 'secretAlert'; count: number }
	| {
			type: 'autoSelectFiles';
			results: { path: string; reason: string }[];
	  }
	| {
			type: 'scanResult';
			files: SidebarFileRow[];
			skippedCount: number;
			fileCount: number;
			originalTokens: number;
			preparedTokens: number;
			tokensSaved: number;
			percentSaved: number;
			tokenBudget: number;
			tokenBudgetExceeded: boolean;
			payloadTokens: number;
			currentDetail: ContextDetail;
			estimatedPayloadCost: number;
			recommendedDetail: ContextDetail | null;
			recommendedTokens: number | null;
			potentialTokensSaved: number;
			potentialMoneySaved: number;
	  };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isBoundedString(value: unknown, maxLength: number): value is string {
	return typeof value === 'string' && value.length <= maxLength;
}

function parseWebviewMessage(raw: unknown): WebviewToExtension | undefined {
	if (!isRecord(raw) || typeof raw.type !== 'string') {
		return undefined;
	}

	switch (raw.type) {
		case 'ready':
		case 'refresh':
		case 'resetStats':
		case 'openRedactionSettings':
			return { type: raw.type };
		case 'toggleFile':
			return isBoundedString(raw.relativePath, MAX_RELATIVE_PATH_LENGTH) &&
				typeof raw.included === 'boolean'
				? {
						type: raw.type,
						relativePath: raw.relativePath,
						included: raw.included,
				  }
				: undefined;
		case 'setAll':
			return typeof raw.included === 'boolean'
				? { type: raw.type, included: raw.included }
				: undefined;
		case 'detailChange':
			return typeof raw.detail === 'string'
				? {
						type: raw.type,
						detail: normalizeContextDetail(raw.detail),
				  }
				: undefined;
		case 'build':
			return Array.isArray(raw.paths) &&
				raw.paths.length <= MAX_REQUESTED_PATHS &&
				raw.paths.every((entry) =>
					isBoundedString(entry, MAX_RELATIVE_PATH_LENGTH)
				) &&
				typeof raw.detail === 'string'
				? {
						type: raw.type,
						paths: raw.paths,
						detail: normalizeContextDetail(raw.detail),
				  }
				: undefined;
		case 'preview':
			return isBoundedString(raw.relativePath, MAX_RELATIVE_PATH_LENGTH) &&
				typeof raw.detail === 'string'
				? {
						type: raw.type,
						relativePath: raw.relativePath,
						detail: normalizeContextDetail(raw.detail),
				  }
				: undefined;
		case 'searchIntent':
			return typeof raw.query === 'string'
				? {
						type: raw.type,
						query: raw.query.slice(0, MAX_INTENT_LENGTH),
				  }
				: undefined;
		default:
			return undefined;
	}
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function createDefaultConfig(): SyntaxxedConfig {
	return {
		includeComments: DEFAULT_SYNTAXXED_CONFIG.includeComments,
		excludePatterns: [],
	};
}

export class SyntaxxedSidebarProvider
	implements vscode.WebviewViewProvider, vscode.Disposable
{
	static readonly viewType = 'syntaxxed.sidebarView';

	private view?: vscode.WebviewView;
	private messageSubscription?: vscode.Disposable;
	private files: PreparedFile[] = [];
	private included = new Set<string>();
	private skippedCount = 0;
	private contextDetail: ContextDetail = 'logic';
	private config = createDefaultConfig();
	private extensionSettings: SyntaxxedExtensionSettings = getExtensionSettings();
	private refreshVersion = 0;
	private summaryVersion = 0;
	private readonly configurationSubscription: vscode.Disposable;

	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly previewProvider: SyntaxxedPreviewProvider,
		private readonly statsManager: StatsManager
	) {
		this.configurationSubscription =
			vscode.workspace.onDidChangeConfiguration((event) => {
				if (!event.affectsConfiguration('syntaxxed')) {
					return;
				}
				this.extensionSettings = getExtensionSettings();
				this.postStats();
				void this.postSummary();
			});
	}

	dispose(): void {
		this.messageSubscription?.dispose();
		this.configurationSubscription.dispose();
	}

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		this.view = webviewView;

		const mediaRoot = vscode.Uri.joinPath(this.extensionUri, 'media');
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [mediaRoot],
		};
		webviewView.webview.html = this.getHtml(webviewView.webview);

		this.messageSubscription?.dispose();
		this.messageSubscription = webviewView.webview.onDidReceiveMessage(
			(raw: unknown) => {
				void this.handleMessage(raw).catch((error: unknown) => {
					const message = getErrorMessage(error);
					this.post({ type: 'status', state: 'error', message });
					void vscode.window.showErrorMessage(`Syntaxxed: ${message}`);
				});
			}
		);
	}

	async refresh(): Promise<void> {
		const version = ++this.refreshVersion;
		this.post({
			type: 'status',
			state: 'loading',
			message: 'Scanning workspace...',
		});

		try {
			this.extensionSettings = getExtensionSettings();
			const workspaceRoots = getWorkspaceRoots();
			const configs = await loadWorkspaceConfigs(workspaceRoots);
			const result = await buildWorkspaceContext({
				workspaceRoots,
				source: 'extension',
				detail: this.contextDetail,
				configs,
				customRedactionRules:
					this.extensionSettings.customRedactionRules,
			});

			if (version !== this.refreshVersion) {
				return;
			}

			this.config = getPrimaryWorkspaceConfig(configs, workspaceRoots);
			this.files = result.files;
			this.skippedCount = result.skippedCount;
			this.included = new Set(
				result.files.map((file) => file.relativePath)
			);
			await this.postSummary();
			this.post({ type: 'status', state: 'idle' });
		} catch (error) {
			if (version === this.refreshVersion) {
				this.post({
					type: 'status',
					state: 'error',
					message: getErrorMessage(error),
				});
			}
		}
	}

	broadcastStats(): void {
		this.postStats();
	}

	private async handleMessage(raw: unknown): Promise<void> {
		const message = parseWebviewMessage(raw);
		if (!message) {
			console.warn('[Syntaxxed] Ignored an invalid webview message.');
			return;
		}

		switch (message.type) {
			case 'ready':
				this.postStats();
				await this.refresh();
				break;
			case 'refresh':
				await this.refresh();
				break;
			case 'toggleFile':
				this.setIncluded(message.relativePath, message.included);
				await this.postSummary();
				break;
			case 'setAll':
				for (const file of this.files) {
					this.setIncluded(file.relativePath, message.included);
				}
				await this.postSummary();
				break;
			case 'detailChange':
				this.contextDetail = message.detail;
				if (message.detail === 'outline') {
					await ensureAstParserReady();
				}
				await this.postSummary();
				break;
			case 'build':
				await this.buildAndCopy(message.paths, message.detail);
				break;
			case 'preview':
				await this.openPreview(message.relativePath, message.detail);
				break;
			case 'searchIntent':
				await this.searchIntent(message.query);
				break;
			case 'resetStats':
				await this.resetStats();
				break;
			case 'openRedactionSettings':
				await vscode.commands.executeCommand(
					'workbench.action.openSettings',
					'@ext:syntaxxed.syntaxxed syntaxxed.customRedactionRules'
				);
				break;
		}
	}

	private async openPreview(
		relativePath: string,
		detail: ContextDetail
	): Promise<void> {
		if (!this.files.some((file) => file.relativePath === relativePath)) {
			throw new Error('The requested preview is not in the current scan.');
		}

		if (detail === 'outline') {
			await ensureAstParserReady();
		}
		await this.previewProvider.openPreview(relativePath, detail);
	}

	private async buildAndCopy(
		requestedPaths: readonly string[],
		detail: ContextDetail
	): Promise<void> {
		const knownPaths = new Set(this.files.map((file) => file.relativePath));
		const paths = [...new Set(requestedPaths)].filter((entry) =>
			knownPaths.has(entry)
		);

		if (paths.length === 0) {
			this.post({
				type: 'status',
				state: 'error',
				message: 'Select at least one file to include.',
			});
			return;
		}

		this.post({
			type: 'status',
			state: 'loading',
			message: 'Building context...',
		});

		try {
			if (detail === 'outline') {
				await ensureAstParserReady();
			}

			this.included = new Set(paths);
			this.contextDetail = detail;
			const result = buildSelectionContext(
				this.files,
				paths,
				this.skippedCount,
				detail,
				{ preserveComments: this.config.includeComments },
				this.extensionSettings.customRedactionRules
			);
			await vscode.env.clipboard.writeText(result.payload);

			await this.statsManager.recordBuild(
				result.originalTokens,
				result.preparedTokens,
				result.tokensSaved,
				result.secretsRedacted
			);
			this.postStats();

			if (result.secretsRedacted > 0) {
				this.post({
					type: 'secretAlert',
					count: result.secretsRedacted,
				});
			}

			const percentSaved =
				result.originalTokens > 0
					? Math.round(
							(result.tokensSaved / result.originalTokens) * 100
					  )
					: 0;
			const message =
				`Built and copied context from ${result.fileCount} file(s): ` +
				`~${result.originalTokens.toLocaleString()} -> ` +
				`~${result.preparedTokens.toLocaleString()} tokens ` +
				`(-${percentSaved}%).`;

			await this.postSummary();
			this.post({ type: 'status', state: 'success', message });
			void vscode.window.showInformationMessage(`Syntaxxed: ${message}`);
		} catch (error) {
			const message = getErrorMessage(error);
			this.post({ type: 'status', state: 'error', message });
			void vscode.window.showErrorMessage(`Syntaxxed: ${message}`);
		}
	}

	private postStats(): void {
		const { session, workspace, lifetime } = this.statsManager.getStats();
		this.post({
			type: 'stats',
			sessionOriginal: session.totalOriginalTokens,
			sessionPrepared: session.totalPreparedTokens,
			sessionSaved: session.totalTokensSaved,
			sessionBuildCount: session.buildCount,
			sessionSecrets: session.totalSecretsRedacted,
			workspaceSaved: workspace.totalTokensSaved,
			lifetimeSaved: lifetime.totalTokensSaved,
			inputCostPerMillionTokens:
				this.extensionSettings.inputCostPerMillionTokens,
			customRedactionRuleCount:
				this.extensionSettings.customRedactionRules.length,
			invalidCustomRedactionRuleCount:
				this.extensionSettings.invalidCustomRedactionRuleCount,
		});
	}

	private async resetStats(): Promise<void> {
		const choice = await vscode.window.showWarningMessage(
			'Reset all Syntaxxed usage statistics for this session, workspace, and installation?',
			{ modal: true },
			'Reset Stats'
		);
		if (choice !== 'Reset Stats') {
			return;
		}

		await this.statsManager.resetAllStats();
		this.postStats();
		void vscode.window.showInformationMessage('Syntaxxed: usage statistics reset.');
	}

	private async searchIntent(query: string): Promise<void> {
		const trimmed = query.trim();
		if (trimmed.length === 0) {
			this.included = new Set(
				this.files.map((file) => file.relativePath)
			);
			this.post({
				type: 'autoSelectFiles',
				results: this.files.map((file) => ({
					path: file.relativePath,
					reason: '',
				})),
			});
			await this.postSummary();
			this.post({ type: 'status', state: 'idle' });
			return;
		}

		await ensureAstParserReady();
		const results = scoreFilesForIntent(trimmed, this.files);
		this.included = new Set(results.map((result) => result.path));

		this.post({ type: 'autoSelectFiles', results });
		await this.postSummary();
		this.post({
			type: 'status',
			state: results.length > 0 ? 'success' : 'idle',
			message:
				results.length > 0
					? `Task focus selected ${results.length} file(s).`
					: 'Task focus did not find matching files.',
		});
	}

	private setIncluded(relativePath: string, included: boolean): void {
		if (!this.files.some((file) => file.relativePath === relativePath)) {
			return;
		}

		if (included) {
			this.included.add(relativePath);
		} else {
			this.included.delete(relativePath);
		}
	}

	private async postSummary(): Promise<void> {
		const version = ++this.summaryVersion;
		const buildOptions = {
			preserveComments: this.config.includeComments,
		};
		const files: SidebarFileRow[] = this.files.map((file) => {
			const preparedContent = prepareContent(
				file.originalContent,
				file.relativePath,
				this.contextDetail,
				buildOptions
			);
			return {
				relativePath: file.relativePath,
				originalTokens: file.originalTokens,
				preparedTokens: estimateTokens(preparedContent),
				included: this.included.has(file.relativePath),
			};
		});

		const summary = buildSelectionContext(
			this.files,
			[...this.included],
			this.skippedCount,
			this.contextDetail,
			buildOptions,
			this.extensionSettings.customRedactionRules
		);
		const payloadTokens = estimateTokens(summary.payload);
		const tokenBudget =
			this.extensionSettings.tokenBudgetWarningThreshold;
		const tokenBudgetExceeded = payloadTokens > tokenBudget;
		let recommendedDetail: ContextDetail | null = null;
		let recommendedTokens: number | null = null;

		if (tokenBudgetExceeded && this.contextDetail !== 'outline') {
			if (!isAstParserReady()) {
				await ensureAstParserReady();
			}
			if (version !== this.summaryVersion) {
				return;
			}
			if (isAstParserReady()) {
				const outlineSummary = buildSelectionContext(
					this.files,
					[...this.included],
					this.skippedCount,
					'outline',
					buildOptions,
					this.extensionSettings.customRedactionRules
				);
				const outlinePayloadTokens = estimateTokens(outlineSummary.payload);
				if (outlinePayloadTokens < payloadTokens) {
					recommendedDetail = 'outline';
					recommendedTokens = outlinePayloadTokens;
				}
			}
		}

		const potentialTokensSaved =
			recommendedTokens === null
				? 0
				: Math.max(0, payloadTokens - recommendedTokens);
		const price = this.extensionSettings.inputCostPerMillionTokens;
		const percentSaved =
			summary.originalTokens > 0
				? Math.round(
						(summary.tokensSaved / summary.originalTokens) * 100
				  )
				: 0;

		this.post({
			type: 'scanResult',
			files,
			skippedCount: this.skippedCount,
			fileCount: summary.fileCount,
			originalTokens: summary.originalTokens,
			preparedTokens: summary.preparedTokens,
			tokensSaved: summary.tokensSaved,
			percentSaved,
			tokenBudget,
			tokenBudgetExceeded,
			payloadTokens,
			currentDetail: this.contextDetail,
			estimatedPayloadCost:
				(payloadTokens / 1_000_000) * price,
			recommendedDetail,
			recommendedTokens,
			potentialTokensSaved,
			potentialMoneySaved:
				(potentialTokensSaved / 1_000_000) * price,
		});
	}

	private post(message: ExtensionToWebview): void {
		void this.view?.webview.postMessage(message);
	}

	private getHtml(webview: vscode.Webview): string {
		const mediaRoot = vscode.Uri.joinPath(this.extensionUri, 'media');
		const stylesUri = webview.asWebviewUri(
			vscode.Uri.joinPath(mediaRoot, 'sidebar.css')
		);
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(mediaRoot, 'sidebar.js')
		);
		const contentSecurityPolicy = [
			"default-src 'none'",
			`style-src ${webview.cspSource.toString()}`,
			`script-src ${webview.cspSource.toString()}`,
		].join('; ');

		return /* html */ `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Syntaxxed</title>
	<link rel="stylesheet" href="${stylesUri.toString()}">
</head>
<body>
	<h1>Workspace context</h1>
	<section class="summary" aria-live="polite">
		<div class="stat">
			<span class="label">Selected files</span>
			<span class="value" id="statFiles">—</span>
		</div>
		<div class="stat accent">
			<span class="label">Token reduction</span>
			<span class="value" id="statSaved">—</span>
		</div>
		<div class="stat">
			<span class="label">Source tokens</span>
			<span class="value" id="statBefore">—</span>
		</div>
		<div class="stat">
			<span class="label">Context tokens</span>
			<span class="value" id="statAfter">—</span>
		</div>
	</section>

	<div class="actions">
		<div class="field">
			<label for="contextDetail">Context detail</label>
			<select id="contextDetail" aria-label="Context detail">
				<option value="outline">Outline - structure and signatures</option>
				<option value="logic" selected>Logic - implementation without comments</option>
				<option value="source">Source - complete file content</option>
			</select>
		</div>
		<div class="field">
			<label for="intentInput">Task focus <span class="optional">(optional)</span></label>
			<input
				type="text"
				id="intentInput"
				maxlength="${MAX_INTENT_LENGTH}"
				placeholder="Describe the task to select relevant files"
				aria-label="Task focus"
			>
		</div>
		<button type="button" id="btnBuild">Build &amp; Copy</button>
		<p class="secret-alert" id="secretAlert" hidden></p>
		<div class="budget-warning" id="budgetWarning" role="status" hidden>
			<span id="budgetWarningText"></span>
			<button type="button" class="warning-action" id="btnUseOutline" hidden>
				Use Outline
			</button>
		</div>
		<button type="button" id="btnRefresh" class="secondary">Rescan Workspace</button>
	</div>

	<div class="toolbar">
		<span class="count" id="fileCountLabel">0 files</span>
		<div>
			<button type="button" class="linkish" id="btnSelectAll">Select all</button>
			<span class="toolbar-separator" aria-hidden="true">|</span>
			<button type="button" class="linkish" id="btnSelectNone">Clear</button>
		</div>
	</div>

	<div class="files" id="fileList" role="list"></div>
	<div class="status" id="status" aria-live="polite"></div>

	<section class="roi" aria-live="polite">
		<div class="roi-header">
			<h2>This session</h2>
			<button type="button" class="linkish" id="btnResetStats" title="Reset usage statistics">
				Reset
			</button>
		</div>
		<div class="token-journey">
			<span class="label">Tokens prepared</span>
			<div class="token-flow">
				<span id="roiSessionOriginal">0</span>
				<span class="token-arrow" aria-hidden="true">&rarr;</span>
				<span class="token-after" id="roiSessionPrepared">0</span>
			</div>
		</div>
		<div class="roi-grid">
			<div class="roi-pill">
				<span class="label">Reduction</span>
				<span class="value" id="roiSessionReduction">0.0%</span>
			</div>
			<div class="roi-pill money">
				<span class="label">Estimated cost saved</span>
				<span class="value" id="roiSessionMoney">$0.00</span>
			</div>
		</div>
		<p class="roi-meta" id="roiMeta">No payloads copied this session.</p>
		<div class="redaction-settings">
			<div>
				<span class="redaction-title">Secret redaction</span>
				<span class="redaction-summary" id="redactionSummary">Built-in protection active</span>
			</div>
			<button type="button" class="linkish" id="btnRedactionSettings">Manage rules</button>
		</div>
	</section>
	<script src="${scriptUri.toString()}"></script>
</body>
</html>`;
	}
}
