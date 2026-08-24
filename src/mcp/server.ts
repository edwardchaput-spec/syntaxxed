/*
 * Syntaxxed MCP Gateway
 *
 * Each instance is bound to exactly one workspace root. It uses an ephemeral
 * loopback port, Streamable HTTP, a cryptographically random bearer token,
 * host/origin validation, and session-scoped disclosure grants.
 */
import {
	randomBytes,
	randomUUID,
	timingSafeEqual,
} from 'node:crypto';
import {
	createServer,
	type IncomingMessage,
	type Server,
	type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
	isInitializeRequest,
	type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { buildWorkspaceFileContext, type ContextDetail } from '../engine';
import { getExtensionSettings } from '../extensionSettings';

const LOOPBACK_HOST = '127.0.0.1';
const MCP_PATH = '/mcp';
const MAX_MCP_BODY_BYTES = 1024 * 1024;
const MAX_CONCURRENT_SESSIONS = 16;

const DENIAL_MESSAGE =
	'Access to implementation detail was not approved. Continue with the available Outline view.';

type ApprovalDetail = Extract<ContextDetail, 'logic' | 'source'>;
export type GatewayApprovalDecision =
	| 'allow-once'
	| 'allow-file-for-session'
	| 'deny';

export interface GatewayApprovalRequest {
	workspaceRoot: string;
	workspaceName: string;
	relativePath: string;
	detail: ApprovalDetail;
	sessionId?: string;
}

export type GatewayApprovalProvider = (
	request: GatewayApprovalRequest
) => Promise<GatewayApprovalDecision>;

export type GatewayAuditAction =
	| 'gateway-started'
	| 'gateway-stopped'
	| 'session-opened'
	| 'session-closed'
	| 'file-disclosed'
	| 'file-denied'
	| 'request-rejected';

export interface GatewayAuditEvent {
	timestamp: string;
	action: GatewayAuditAction;
	workspaceRoot: string;
	workspaceName: string;
	sessionId?: string;
	relativePath?: string;
	contextDetail?: ContextDetail;
	detail?: string;
}

export interface SyntaxxedMcpGatewayOptions {
	workspaceRoot: string;
	workspaceName?: string;
	/** Zero selects an ephemeral operating-system-assigned port. */
	port?: number;
	authToken?: string;
	approvalProvider?: GatewayApprovalProvider;
	onAuditEvent?: (event: GatewayAuditEvent) => void;
}

export interface GatewayEndpoint {
	workspaceRoot: string;
	workspaceName: string;
	port: number;
	url: string;
	authorizationHeader: string;
}

interface SessionRecord {
	transport: StreamableHTTPServerTransport;
	server: McpServer;
}

const APPROVAL_LABELS: Record<ApprovalDetail, string> = {
	logic: 'implementation logic',
	source: 'the complete source file',
};

function textResult(text: string): CallToolResult {
	return { content: [{ type: 'text', text }] };
}

function errorResult(error: unknown): CallToolResult {
	const message = error instanceof Error ? error.message : String(error);
	return {
		content: [{ type: 'text', text: `Syntaxxed Gateway error: ${message}` }],
		isError: true,
	};
}

function secureEquals(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	return (
		leftBuffer.length === rightBuffer.length &&
		timingSafeEqual(leftBuffer, rightBuffer)
	);
}

class HttpRequestError extends Error {
	constructor(
		public readonly status: number,
		message: string
	) {
		super(message);
	}
}

function sessionIdFromRequest(request: IncomingMessage): string | undefined {
	const value = request.headers['mcp-session-id'];
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function sendJsonRpcError(
	response: ServerResponse,
	status: number,
	message: string
): void {
	const body = JSON.stringify({
		jsonrpc: '2.0',
		error: { code: -32_000, message },
		id: null,
	});
	response.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Length': Buffer.byteLength(body),
	});
	response.end(body);
}

function sendText(
	response: ServerResponse,
	status: number,
	message: string
): void {
	response.writeHead(status, {
		'Content-Type': 'text/plain; charset=utf-8',
		'Content-Length': Buffer.byteLength(message),
	});
	response.end(message);
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
	const contentType = request.headers['content-type']
		?.split(';', 1)
		.at(0)
		?.trim()
		.toLowerCase();
	if (contentType !== 'application/json') {
		request.resume();
		throw new HttpRequestError(415, 'Content-Type must be application/json.');
	}

	const contentLength = request.headers['content-length'];
	if (contentLength !== undefined) {
		const declaredBytes = Number(contentLength);
		if (!Number.isSafeInteger(declaredBytes) || declaredBytes < 0) {
			request.resume();
			throw new HttpRequestError(400, 'Invalid Content-Length header.');
		}
		if (declaredBytes > MAX_MCP_BODY_BYTES) {
			request.resume();
			throw new HttpRequestError(413, 'MCP request body is too large.');
		}
	}

	const chunks: Buffer[] = [];
	let bytes = 0;
	for await (const rawChunk of request) {
		const chunk = Buffer.from(rawChunk as Uint8Array);
		bytes += chunk.byteLength;
		if (bytes > MAX_MCP_BODY_BYTES) {
			request.resume();
			throw new HttpRequestError(413, 'MCP request body is too large.');
		}
		chunks.push(chunk);
	}

	if (bytes === 0) {
		throw new HttpRequestError(400, 'MCP request body is required.');
	}
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
	} catch {
		throw new HttpRequestError(400, 'MCP request body is not valid JSON.');
	}
}

export class SyntaxxedMcpGateway implements vscode.Disposable {
	private readonly workspaceRoot: string;
	private readonly workspaceName: string;
	private readonly requestedPort: number;
	private readonly authToken: string;
	private readonly approvalProvider: GatewayApprovalProvider;
	private readonly onAuditEvent:
		| ((event: GatewayAuditEvent) => void)
		| undefined;
	private readonly sessions = new Map<string, SessionRecord>();
	private readonly sessionGrants = new Map<string, Set<string>>();
	private httpServer: Server | undefined;
	private endpoint: GatewayEndpoint | undefined;
	private pendingSessions = 0;

	constructor(options: SyntaxxedMcpGatewayOptions) {
		this.workspaceRoot = path.resolve(options.workspaceRoot);
		this.workspaceName =
			options.workspaceName ?? path.basename(this.workspaceRoot);
		this.requestedPort = options.port ?? 0;
		this.authToken =
			options.authToken ?? randomBytes(32).toString('base64url');
		this.approvalProvider =
			options.approvalProvider ?? this.showApprovalPrompt.bind(this);
		this.onAuditEvent = options.onAuditEvent;
	}

	public async start(): Promise<GatewayEndpoint> {
		if (this.endpoint) {
			return this.endpoint;
		}

		const httpServer = await new Promise<Server>((resolve, reject) => {
			const candidate = createServer((request, response) => {
				void this.handleHttpRequest(request, response);
			});
			candidate.once('error', reject);
			candidate.listen(this.requestedPort, LOOPBACK_HOST, () =>
				resolve(candidate)
			);
		});
		this.httpServer = httpServer;

		const address = httpServer.address() as AddressInfo | null;
		if (!address) {
			await this.stop();
			throw new Error('The Syntaxxed Gateway did not receive a local port.');
		}

		this.endpoint = {
			workspaceRoot: this.workspaceRoot,
			workspaceName: this.workspaceName,
			port: address.port,
			url: `http://${LOOPBACK_HOST}:${address.port}${MCP_PATH}`,
			authorizationHeader: `Bearer ${this.authToken}`,
		};
		this.audit('gateway-started', { detail: `port=${address.port}` });
		return this.endpoint;
	}

	public getEndpoint(): GatewayEndpoint | undefined {
		return this.endpoint ? { ...this.endpoint } : undefined;
	}

	public dispose(): void {
		void this.stop();
	}

	public async stop(): Promise<void> {
		const records = [...this.sessions.values()];
		this.sessions.clear();
		this.sessionGrants.clear();
		await Promise.allSettled(
			records.map(async ({ server }) => server.close())
		);

		const httpServer = this.httpServer;
		this.httpServer = undefined;
		this.endpoint = undefined;
		if (httpServer) {
			httpServer.closeAllConnections();
			await new Promise<void>((resolve) => {
				httpServer.close(() => resolve());
			});
		}
		this.audit('gateway-stopped');
	}

	private async handleHttpRequest(
		request: IncomingMessage,
		response: ServerResponse
	): Promise<void> {
		response.setHeader('Cache-Control', 'no-store');
		response.setHeader('X-Content-Type-Options', 'nosniff');

		try {
			const requestPath = new URL(
				request.url ?? '/',
				`http://${LOOPBACK_HOST}`
			).pathname;
			if (requestPath !== MCP_PATH) {
				sendText(response, 404, 'Not found');
				return;
			}
			if (!this.authenticateRequest(request, response)) {
				return;
			}

			switch (request.method) {
				case 'POST': {
					const body = await readJsonBody(request);
					await this.handlePost(request, response, body);
					return;
				}
				case 'GET':
				case 'DELETE':
					await this.handleExistingSession(request, response);
					return;
				default:
					response.setHeader('Allow', 'POST, GET, DELETE');
					sendText(response, 405, 'Method not allowed');
			}
		} catch (error) {
			if (!response.headersSent) {
				if (error instanceof HttpRequestError) {
					this.audit('request-rejected', {
						detail:
							error.status === 413
								? 'request-too-large'
								: 'invalid-request-body',
					});
					sendJsonRpcError(response, error.status, error.message);
				} else {
					console.error('[Syntaxxed] MCP HTTP request failed:', error);
					sendJsonRpcError(response, 500, 'Internal gateway error.');
				}
			} else if (!response.writableEnded) {
				response.end();
			}
		}
	}

	private authenticateRequest(
		request: IncomingMessage,
		response: ServerResponse
	): boolean {

		const port = this.endpoint?.port;
		const expectedHost = port ? `${LOOPBACK_HOST}:${port}` : undefined;
		if (!expectedHost || request.headers.host !== expectedHost) {
			this.audit('request-rejected', { detail: 'invalid-host' });
			request.resume();
			sendText(response, 403, 'Forbidden');
			return false;
		}
		if (request.headers.origin !== undefined) {
			this.audit('request-rejected', { detail: 'browser-origin' });
			request.resume();
			sendText(response, 403, 'Browser-origin requests are not allowed.');
			return false;
		}

		const authorization = request.headers.authorization ?? '';
		const expectedAuthorization = `Bearer ${this.authToken}`;
		if (!secureEquals(authorization, expectedAuthorization)) {
			this.audit('request-rejected', { detail: 'invalid-authorization' });
			request.resume();
			response.setHeader('WWW-Authenticate', 'Bearer');
			sendText(response, 401, 'Unauthorized');
			return false;
		}
		return true;
	}

	private async handlePost(
		request: IncomingMessage,
		response: ServerResponse,
		body: unknown
	): Promise<void> {
		try {
			const sessionId = sessionIdFromRequest(request);
			if (sessionId) {
				const record = this.sessions.get(sessionId);
				if (!record) {
					sendJsonRpcError(response, 404, 'Unknown MCP session.');
					return;
				}
				await record.transport.handleRequest(request, response, body);
				return;
			}

			if (!isInitializeRequest(body)) {
				sendJsonRpcError(
					response,
					400,
					'An initialization request or MCP session ID is required.'
				);
				return;
			}
			if (
				this.sessions.size + this.pendingSessions >=
				MAX_CONCURRENT_SESSIONS
			) {
				sendJsonRpcError(response, 429, 'Too many active MCP sessions.');
				return;
			}

			this.pendingSessions++;
			try {
				await this.initializeSession(request, response, body);
			} finally {
				this.pendingSessions--;
			}
		} catch (error) {
			console.error('[Syntaxxed] MCP request failed:', error);
			if (!response.headersSent) {
				sendJsonRpcError(response, 500, 'Internal gateway error.');
			}
		}
	}

	private async initializeSession(
		request: IncomingMessage,
		response: ServerResponse,
		body: unknown
	): Promise<void> {
		let initializedSessionId: string | undefined;
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: () => randomUUID(),
			enableJsonResponse: true,
			onsessioninitialized: (sessionId) => {
				initializedSessionId = sessionId;
			},
		});
		const server = this.createMcpServer();
		await server.connect(
			transport as unknown as Parameters<McpServer['connect']>[0]
		);

		try {
			await transport.handleRequest(request, response, body);
			if (!initializedSessionId) {
				throw new Error('MCP transport did not initialize a session.');
			}

			const sessionId = initializedSessionId;
			this.sessions.set(sessionId, { transport, server });
			this.sessionGrants.set(sessionId, new Set());
			transport.onclose = () => this.closeSession(sessionId);
			this.audit('session-opened', { sessionId });
		} catch (error) {
			await server.close();
			throw error;
		}
	}

	private async handleExistingSession(
		request: IncomingMessage,
		response: ServerResponse
	): Promise<void> {
		try {
			const sessionId = sessionIdFromRequest(request);
			const record = sessionId
				? this.sessions.get(sessionId)
				: undefined;
			if (!sessionId || !record) {
				sendJsonRpcError(response, 404, 'Unknown MCP session.');
				return;
			}
			await record.transport.handleRequest(request, response);
		} catch (error) {
			console.error('[Syntaxxed] MCP session request failed:', error);
			if (!response.headersSent) {
				sendJsonRpcError(response, 500, 'Internal gateway error.');
			}
		}
	}

	private closeSession(sessionId: string): void {
		if (!this.sessions.delete(sessionId)) {
			return;
		}
		this.sessionGrants.delete(sessionId);
		this.audit('session-closed', { sessionId });
	}

	private createMcpServer(): McpServer {
		const server = new McpServer({
			name: 'syntaxxed-gateway',
			version: '0.3.0',
		});
		const inputSchema = {
			filePath: z
				.string()
				.min(1)
				.max(4_096)
				.describe('Workspace-relative or absolute path of the file to read.'),
		};

		server.registerTool(
			'get_file_outline',
			{
				title: 'Get File Outline',
				description:
					'Return declarations, types, interfaces, and signatures with ' +
					'supported implementation bodies removed. Use this first.',
				inputSchema,
				annotations: { readOnlyHint: true, openWorldHint: false },
			},
			async ({ filePath }, extra) => {
				let relativePath: string | undefined;
				try {
					relativePath = this.resolveRelativePath(filePath);
					const result = await this.buildSingleFile(relativePath, 'outline');
					this.audit('file-disclosed', {
						...(extra.sessionId === undefined
							? {}
							: { sessionId: extra.sessionId }),
						relativePath,
						contextDetail: 'outline',
					});
					return textResult(result);
				} catch (error) {
					this.audit('request-rejected', {
						...(extra.sessionId === undefined
							? {}
							: { sessionId: extra.sessionId }),
						...(relativePath === undefined ? {} : { relativePath }),
						contextDetail: 'outline',
						detail: 'file-request-failed',
					});
					return errorResult(error);
				}
			}
		);

		server.registerTool(
			'request_file_logic',
			{
				title: 'Request File Logic',
				description:
					'Request implementation logic with comments and excess formatting removed. ' +
					'The developer may need to approve this disclosure.',
				inputSchema,
				annotations: { readOnlyHint: true, openWorldHint: false },
			},
			({ filePath }, extra) =>
				this.runApprovedTool(filePath, 'logic', extra.sessionId)
		);

		server.registerTool(
			'request_file_source',
			{
				title: 'Request File Source',
				description:
					'Request the complete source file after secret redaction. ' +
					'The developer may need to approve this disclosure.',
				inputSchema,
				annotations: { readOnlyHint: true, openWorldHint: false },
			},
			({ filePath }, extra) =>
				this.runApprovedTool(filePath, 'source', extra.sessionId)
		);

		return server;
	}

	private async runApprovedTool(
		filePath: string,
		detail: ApprovalDetail,
		sessionId?: string
	): Promise<CallToolResult> {
		let relativePath: string | undefined;
		try {
			relativePath = this.resolveRelativePath(filePath);
			const approved = await this.requestHumanApproval({
				workspaceRoot: this.workspaceRoot,
				workspaceName: this.workspaceName,
				relativePath,
				detail,
				...(sessionId === undefined ? {} : { sessionId }),
			});
			if (!approved) {
				this.audit('file-denied', {
					...(sessionId === undefined ? {} : { sessionId }),
					relativePath,
					contextDetail: detail,
				});
				return textResult(DENIAL_MESSAGE);
			}

			const result = await this.buildSingleFile(relativePath, detail);
			this.audit('file-disclosed', {
				...(sessionId === undefined ? {} : { sessionId }),
				relativePath,
				contextDetail: detail,
			});
			return textResult(result);
		} catch (error) {
			this.audit('request-rejected', {
				...(sessionId === undefined ? {} : { sessionId }),
				...(relativePath === undefined ? {} : { relativePath }),
				contextDetail: detail,
				detail: 'file-request-failed',
			});
			return errorResult(error);
		}
	}

	private async requestHumanApproval(
		request: GatewayApprovalRequest
	): Promise<boolean> {
		const grantKey = `${request.detail}\0${request.relativePath}`;
		const grants = request.sessionId
			? this.sessionGrants.get(request.sessionId)
			: undefined;
		if (grants?.has(grantKey)) {
			return true;
		}

		const decision = await this.approvalProvider(request);
		if (decision === 'allow-file-for-session' && grants) {
			grants.add(grantKey);
		}
		return decision !== 'deny';
	}

	private async showApprovalPrompt(
		request: GatewayApprovalRequest
	): Promise<GatewayApprovalDecision> {
		const choice = await vscode.window.showWarningMessage(
			`Syntaxxed Gateway: allow access to ${APPROVAL_LABELS[request.detail]}?`,
			{
				modal: true,
				detail:
					`Workspace: ${request.workspaceName}\n` +
					`File: ${request.relativePath}\n\n` +
					'Secret redaction is applied before the content is returned.',
			},
			'Allow Once',
			'Allow This File for Session',
			'Deny'
		);

		switch (choice) {
			case 'Allow Once':
				return 'allow-once';
			case 'Allow This File for Session':
				return 'allow-file-for-session';
			default:
				return 'deny';
		}
	}

	private resolveRelativePath(filePath: string): string {
		let relative = filePath;
		if (path.isAbsolute(filePath)) {
			const candidate = path.relative(this.workspaceRoot, filePath);
			if (
				candidate.length === 0 ||
				candidate === '..' ||
				candidate.startsWith(`..${path.sep}`) ||
				path.isAbsolute(candidate)
			) {
				throw new Error(`Path is outside the gateway workspace: ${filePath}`);
			}
			relative = candidate;
		}

		if (relative.includes('\0')) {
			throw new Error('File paths cannot contain null characters.');
		}
		const slashPath = relative.replace(/\\/g, '/');
		if (path.posix.isAbsolute(slashPath)) {
			throw new Error(`Invalid file path: ${filePath}`);
		}
		const normalized = path.posix
			.normalize(slashPath)
			.replace(/^(\.\/)+/, '');
		if (
			normalized.length === 0 ||
			normalized === '.' ||
			normalized === '..' ||
			normalized.startsWith('../')
		) {
			throw new Error(`Invalid file path: ${filePath}`);
		}
		return normalized;
	}

	private async buildSingleFile(
		relativePath: string,
		detail: ContextDetail
	): Promise<string> {
		const settings = getExtensionSettings();
		const result = await buildWorkspaceFileContext({
			workspaceRoot: this.workspaceRoot,
			relativePath,
			source: 'extension',
			detail,
			customRedactionRules: settings.customRedactionRules,
		});
		if (result.fileCount === 0) {
			throw new Error(
				`File is missing, ignored, binary, oversized, or linked: ${relativePath}`
			);
		}
		return result.payload;
	}

	private audit(
		action: GatewayAuditAction,
		details: Omit<
			GatewayAuditEvent,
			'timestamp' | 'action' | 'workspaceRoot' | 'workspaceName'
		> = {}
	): void {
		this.onAuditEvent?.({
			timestamp: new Date().toISOString(),
			action,
			workspaceRoot: this.workspaceRoot,
			workspaceName: this.workspaceName,
			...details,
		});
	}
}
