import * as vscode from 'vscode';
import {
	buildWorkspaceContext,
	CONFIG_FILENAME,
	createWorkspaceConfigFile,
	initializeAstParser,
} from './engine';
import { SyntaxxedGatewayManager } from './mcp/gatewayManager';
import { registerSyntaxxedPreviewProvider } from './previewProvider';
import { SyntaxxedSidebarProvider } from './sidebarProvider';
import { StatsManager } from './statsManager';
import { getExtensionSettings } from './extensionSettings';
import { getWorkspaceRoots } from './workspaceBridge';

let gatewayManager: SyntaxxedGatewayManager | undefined;

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function showExtensionError(error: unknown): void {
	void vscode.window.showErrorMessage(`Syntaxxed: ${getErrorMessage(error)}`);
}

export function activate(context: vscode.ExtensionContext): void {
	console.log('[Syntaxxed] Extension activated.');

	const wasmDirectory = vscode.Uri.joinPath(
		context.extensionUri,
		'media',
		'tree-sitter'
	).fsPath;
	void initializeAstParser(wasmDirectory).catch(() => {
		// Interactive Outline previews stay conservative if parser setup fails.
	});

	const gatewayOutput = vscode.window.createOutputChannel('Syntaxxed Gateway');
	gatewayManager = new SyntaxxedGatewayManager(context, gatewayOutput);
	context.subscriptions.push(gatewayOutput, gatewayManager);
	void gatewayManager.restore().catch(showExtensionError);

	const statsManager = new StatsManager(context);
	const previewProvider = registerSyntaxxedPreviewProvider(context);
	const sidebarProvider = new SyntaxxedSidebarProvider(
		context.extensionUri,
		previewProvider,
		statsManager
	);
	const sidebarRegistration = vscode.window.registerWebviewViewProvider(
		SyntaxxedSidebarProvider.viewType,
		sidebarProvider,
		{ webviewOptions: { retainContextWhenHidden: true } }
	);

	context.subscriptions.push(sidebarProvider, sidebarRegistration);

	const buildContextCommand = vscode.commands.registerCommand(
		'syntaxxed.buildContext',
		async () => {
			try {
				const result = await vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: 'Syntaxxed: building workspace context...',
						cancellable: false,
					},
					() => {
						const settings = getExtensionSettings();
						return buildWorkspaceContext({
							workspaceRoots: getWorkspaceRoots(),
							source: 'extension',
							customRedactionRules: settings.customRedactionRules,
						});
					}
				);

				await vscode.env.clipboard.writeText(result.payload);
				await statsManager.recordBuild(
					result.originalTokens,
					result.preparedTokens,
					result.tokensSaved,
					result.secretsRedacted
				);
				sidebarProvider.broadcastStats();

				const percentSaved =
					result.originalTokens > 0
						? Math.round(
								(result.tokensSaved / result.originalTokens) * 100
						  )
						: 0;
				const summary =
					`Syntaxxed built context from ${result.fileCount} file(s)` +
					(result.skippedCount > 0
						? ` (skipped ${result.skippedCount})`
						: '') +
					`: ~${result.originalTokens.toLocaleString()} -> ` +
					`~${result.preparedTokens.toLocaleString()} tokens ` +
					`(-${result.tokensSaved.toLocaleString()}, ${percentSaved}%). ` +
					'Copied to clipboard.';

				void vscode.window.showInformationMessage(summary);
			} catch (error) {
				showExtensionError(error);
			}
		}
	);

	const createConfigCommand = vscode.commands.registerCommand(
		'syntaxxed.createConfig',
		async () => {
			try {
				if (!vscode.workspace.isTrusted) {
					throw new Error(
						`Trust this workspace before creating ${CONFIG_FILENAME}.`
					);
				}
				const folder = vscode.workspace.workspaceFolders?.[0];
				if (!folder) {
					throw new Error(
						`Open a workspace folder before creating ${CONFIG_FILENAME}.`
					);
				}

				const creation = await createWorkspaceConfigFile(
					folder.uri.fsPath
				);
				const configUri = vscode.Uri.joinPath(folder.uri, CONFIG_FILENAME);
				if (!creation.created) {
					const choice = await vscode.window.showWarningMessage(
						`${CONFIG_FILENAME} already exists in this workspace.`,
						'Open File'
					);
					if (choice !== 'Open File') {
						return;
					}
				}

				const document = await vscode.workspace.openTextDocument(configUri);
				await vscode.window.showTextDocument(document);
				if (creation.created) {
					void vscode.window.showInformationMessage(
						`Syntaxxed: created ${CONFIG_FILENAME} in the workspace root.`
					);
				}
				await sidebarProvider.refresh();
			} catch (error) {
				showExtensionError(error);
			}
		}
	);

	const openAgentGuideCommand = vscode.commands.registerCommand(
		'syntaxxed.openAgentGuide',
		async () => {
			try {
				const guideUri = vscode.Uri.joinPath(
					context.extensionUri,
					'docs',
					'agent-gateway.md'
				);
				const document = await vscode.workspace.openTextDocument(guideUri);
				await vscode.window.showTextDocument(document, { preview: true });
				await vscode.commands.executeCommand(
					'markdown.showPreview',
					guideUri
				);
			} catch (error) {
				showExtensionError(error);
			}
		}
	);

	const openQuickStartCommand = vscode.commands.registerCommand(
		'syntaxxed.openQuickStart',
		() =>
			vscode.commands.executeCommand(
				'workbench.action.openWalkthrough',
				'syntaxxed.syntaxxed#syntaxxed.quickStart',
				false
			)
	);

	const openSidebarCommand = vscode.commands.registerCommand(
		'syntaxxed.openSidebar',
		() => vscode.commands.executeCommand('syntaxxed.sidebarView.focus')
	);

	const refreshSidebarCommand = vscode.commands.registerCommand(
		'syntaxxed.refreshSidebar',
		() => sidebarProvider.refresh()
	);

	const enableGatewayCommand = vscode.commands.registerCommand(
		'syntaxxed.enableGateway',
		async () => {
			try {
				if (await gatewayManager?.enable()) {
					void vscode.window.showInformationMessage(
						'Syntaxxed Gateway enabled. Restart or reconnect your MCP client if needed.'
					);
				}
			} catch (error) {
				showExtensionError(error);
			}
		}
	);

	const disableGatewayCommand = vscode.commands.registerCommand(
		'syntaxxed.disableGateway',
		async () => {
			try {
				if (await gatewayManager?.disable()) {
					void vscode.window.showInformationMessage(
						'Syntaxxed Gateway disabled and project registrations removed.'
					);
				}
			} catch (error) {
				showExtensionError(error);
			}
		}
	);

	const gatewayStatusCommand = vscode.commands.registerCommand(
		'syntaxxed.gatewayStatus',
		() => {
			const status = gatewayManager?.getStatus();
			const endpoints =
				status?.running.map(
					(endpoint) => `${endpoint.workspaceName}: ${endpoint.url}`
				) ?? [];
			void vscode.window.showInformationMessage(
				status?.enabled
					? endpoints.length > 0
						? `Syntaxxed Gateway is running - ${endpoints.join('; ')}`
						: 'Syntaxxed Gateway is enabled but is not currently running.'
					: 'Syntaxxed Gateway is disabled for this workspace.'
			);
		}
	);

	context.subscriptions.push(
		buildContextCommand,
		createConfigCommand,
		openAgentGuideCommand,
		openQuickStartCommand,
		openSidebarCommand,
		refreshSidebarCommand,
		enableGatewayCommand,
		disableGatewayCommand,
		gatewayStatusCommand
	);
}

export function deactivate(): void {
	gatewayManager?.dispose();
	gatewayManager = undefined;
}
