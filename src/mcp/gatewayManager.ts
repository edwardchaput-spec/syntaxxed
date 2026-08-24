import * as path from 'node:path';
import * as vscode from 'vscode';
import {
	ensureMcpRegistrations,
	removeMcpRegistrations,
	type McpRegistrationResult,
} from '../engine';
import {
	SyntaxxedMcpGateway,
	type GatewayAuditEvent,
	type GatewayEndpoint,
} from './server';

const GATEWAY_ENABLED_STATE_KEY = 'syntaxxed.gateway.enabled.v1';

interface ManagedGateway {
	gateway: SyntaxxedMcpGateway;
	endpoint: GatewayEndpoint;
}

export interface GatewayManagerStatus {
	enabled: boolean;
	running: GatewayEndpoint[];
}

function describeRegistrationFailures(result: McpRegistrationResult): string {
	return result.failed.length > 0
		? ` Could not update: ${result.failed.join(', ')}.`
		: '';
}

export class SyntaxxedGatewayManager implements vscode.Disposable {
	private readonly gateways = new Map<string, ManagedGateway>();
	private readonly workspaceSubscription: vscode.Disposable;
	private operation: Promise<void> = Promise.resolve();

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly output: vscode.OutputChannel
	) {
		this.workspaceSubscription =
			vscode.workspace.onDidChangeWorkspaceFolders((event) => {
				if (!this.isEnabled()) {
					return;
				}
				void this.enqueue(async () => {
					for (const folder of event.removed) {
						await removeMcpRegistrations(folder.uri.fsPath);
					}
					await this.stopGateways();
					await this.startGateways();
				});
			});
	}

	public isEnabled(): boolean {
		return this.context.workspaceState.get<boolean>(
			GATEWAY_ENABLED_STATE_KEY,
			false
		);
	}

	public getStatus(): GatewayManagerStatus {
		return {
			enabled: this.isEnabled(),
			running: [...this.gateways.values()].map(({ endpoint }) => ({
				...endpoint,
				authorizationHeader: '[stored in MCP configuration]',
			})),
		};
	}

	/** Restore a gateway that the user explicitly enabled in this workspace. */
	public async restore(): Promise<void> {
		if (!this.isEnabled() || !vscode.workspace.isTrusted) {
			return;
		}
		await this.enqueue(() => this.startGateways());
	}

	public async enable(): Promise<boolean> {
		if (!vscode.workspace.isTrusted) {
			throw new Error(
				'Trust this workspace before enabling the MCP gateway.'
			);
		}
		if ((vscode.workspace.workspaceFolders?.length ?? 0) === 0) {
			throw new Error('Open a workspace folder before enabling the gateway.');
		}

		if (!this.isEnabled()) {
			const choice = await vscode.window.showWarningMessage(
				'Enable the Syntaxxed MCP Gateway for this workspace?',
				{
					modal: true,
					detail:
						'Syntaxxed will start one authenticated loopback-only server per ' +
						'workspace folder and add a machine-specific entry to .mcp.json ' +
						'and .cursor/mcp.json. Existing servers are preserved. These ' +
						'generated endpoint entries should not be committed.',
				},
				'Enable Gateway'
			);
			if (choice !== 'Enable Gateway') {
				return false;
			}
			await this.context.workspaceState.update(
				GATEWAY_ENABLED_STATE_KEY,
				true
			);
		}

		await this.enqueue(() => this.startGateways());
		return true;
	}

	public async disable(): Promise<boolean> {
		const choice = await vscode.window.showWarningMessage(
			'Disable the Syntaxxed MCP Gateway for this workspace?',
			{
				modal: true,
				detail:
					'The local servers will stop and only Syntaxxed gateway ' +
					'entries will be removed from project MCP configuration files.',
			},
			'Disable Gateway'
		);
		if (choice !== 'Disable Gateway') {
			return false;
		}

		await this.context.workspaceState.update(
			GATEWAY_ENABLED_STATE_KEY,
			false
		);
		const cleanupFailures: string[] = [];
		await this.enqueue(async () => {
			await this.stopGateways();
			for (const folder of vscode.workspace.workspaceFolders ?? []) {
				const result = await removeMcpRegistrations(folder.uri.fsPath);
				if (result.failed.length > 0) {
					cleanupFailures.push(
						`${folder.name}: ${result.failed.join(', ')}`
					);
					this.output.appendLine(
						`Could not remove gateway registration from ${folder.name}: ` +
						result.failed.join(', ')
					);
				}
			}
		});
		if (cleanupFailures.length > 0) {
			throw new Error(
				'Gateway stopped, but some project registrations could not be ' +
					`removed (${cleanupFailures.join('; ')}). Remove only the ` +
					'"syntaxxed-gateway" entries manually or run Disable again.'
			);
		}
		return true;
	}

	public dispose(): void {
		this.workspaceSubscription.dispose();
		void this.enqueue(() => this.stopGateways());
	}

	private enqueue(operation: () => Promise<void>): Promise<void> {
		this.operation = this.operation.then(operation, operation);
		return this.operation;
	}

	private async startGateways(): Promise<void> {
		if (!this.isEnabled() || !vscode.workspace.isTrusted) {
			return;
		}

		for (const folder of vscode.workspace.workspaceFolders ?? []) {
			const workspaceRoot = path.resolve(folder.uri.fsPath);
			if (this.gateways.has(workspaceRoot)) {
				continue;
			}

			const gateway = new SyntaxxedMcpGateway({
				workspaceRoot,
				workspaceName: folder.name,
				onAuditEvent: (event) => this.writeAuditEvent(event),
			});
			try {
				const endpoint = await gateway.start();
				const registration = await ensureMcpRegistrations(workspaceRoot, {
					url: endpoint.url,
					authorizationHeader: endpoint.authorizationHeader,
				});
				this.gateways.set(workspaceRoot, { gateway, endpoint });
				this.output.appendLine(
					`Gateway ready for ${folder.name} at ${endpoint.url}.` +
						describeRegistrationFailures(registration)
				);
			} catch (error) {
				await gateway.stop();
				const message =
					error instanceof Error ? error.message : String(error);
				this.output.appendLine(
					`Gateway failed for ${folder.name}: ${message}`
				);
				throw error;
			}
		}
	}

	private async stopGateways(): Promise<void> {
		const gateways = [...this.gateways.values()].map(
			({ gateway }) => gateway
		);
		this.gateways.clear();
		await Promise.allSettled(gateways.map(async (gateway) => gateway.stop()));
	}

	private writeAuditEvent(event: GatewayAuditEvent): void {
		this.output.appendLine(JSON.stringify(event));
	}
}
