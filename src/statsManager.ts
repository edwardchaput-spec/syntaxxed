import type * as vscode from 'vscode';

export interface ContextBuildStats {
	totalOriginalTokens: number;
	totalPreparedTokens: number;
	totalTokensSaved: number;
	buildCount: number;
	totalSecretsRedacted: number;
}

export interface RoiStatsSnapshot {
	session: ContextBuildStats;
	workspace: ContextBuildStats;
	lifetime: ContextBuildStats;
}

interface ContextBuildDelta {
	originalTokens: number;
	preparedTokens: number;
	tokensSaved: number;
	secretsRedacted: number;
}

const STATS_STORAGE_KEY = 'syntaxxed.contextBuildStats';

function createEmptyStats(): ContextBuildStats {
	return {
		totalOriginalTokens: 0,
		totalPreparedTokens: 0,
		totalTokensSaved: 0,
		buildCount: 0,
		totalSecretsRedacted: 0,
	};
}

function sanitizeCount(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
		return 0;
	}
	return Math.min(Math.floor(value), Number.MAX_SAFE_INTEGER);
}

function safeAdd(left: number, right: number): number {
	return Math.min(left + right, Number.MAX_SAFE_INTEGER);
}

function normalizeStats(raw: unknown): ContextBuildStats {
	if (!raw || typeof raw !== 'object') {
		return createEmptyStats();
	}

	const data = raw as Partial<ContextBuildStats>;
	return {
		totalOriginalTokens: sanitizeCount(data.totalOriginalTokens),
		totalPreparedTokens: sanitizeCount(data.totalPreparedTokens),
		totalTokensSaved: sanitizeCount(data.totalTokensSaved),
		buildCount: sanitizeCount(data.buildCount),
		totalSecretsRedacted: sanitizeCount(data.totalSecretsRedacted),
	};
}

function normalizeDelta(delta: ContextBuildDelta): ContextBuildDelta {
	return {
		originalTokens: sanitizeCount(delta.originalTokens),
		preparedTokens: sanitizeCount(delta.preparedTokens),
		tokensSaved: sanitizeCount(delta.tokensSaved),
		secretsRedacted: sanitizeCount(delta.secretsRedacted),
	};
}

export class StatsManager {
	private sessionStats = createEmptyStats();

	constructor(private readonly context: vscode.ExtensionContext) {}

	getStats(): RoiStatsSnapshot {
		return {
			session: { ...this.sessionStats },
			workspace: this.readWorkspaceStats(),
			lifetime: this.readLifetimeStats(),
		};
	}

	async recordBuild(
		originalTokens: number,
		preparedTokens: number,
		tokensSaved = Math.max(0, originalTokens - preparedTokens),
		secretsRedacted = 0
	): Promise<RoiStatsSnapshot> {
		const delta = normalizeDelta({
			originalTokens,
			preparedTokens,
			tokensSaved,
			secretsRedacted,
		});
		const workspace = this.applyDelta(this.readWorkspaceStats(), delta);
		const lifetime = this.applyDelta(this.readLifetimeStats(), delta);
		this.sessionStats = this.applyDelta(this.sessionStats, delta);

		await Promise.all([
			this.writeWorkspaceStats(workspace),
			this.writeLifetimeStats(lifetime),
		]);

		return { session: { ...this.sessionStats }, workspace, lifetime };
	}

	async resetWorkspaceStats(): Promise<RoiStatsSnapshot> {
		await this.writeWorkspaceStats(createEmptyStats());
		return this.getStats();
	}

	async resetLifetimeStats(): Promise<RoiStatsSnapshot> {
		await this.writeLifetimeStats(createEmptyStats());
		return this.getStats();
	}

	async resetAllStats(): Promise<RoiStatsSnapshot> {
		this.sessionStats = createEmptyStats();
		await Promise.all([
			this.writeWorkspaceStats(createEmptyStats()),
			this.writeLifetimeStats(createEmptyStats()),
		]);
		return this.getStats();
	}

	private readWorkspaceStats(): ContextBuildStats {
		return normalizeStats(
			this.context.workspaceState.get<ContextBuildStats>(STATS_STORAGE_KEY)
		);
	}

	private readLifetimeStats(): ContextBuildStats {
		return normalizeStats(
			this.context.globalState.get<ContextBuildStats>(STATS_STORAGE_KEY)
		);
	}

	private async writeWorkspaceStats(
		stats: ContextBuildStats
	): Promise<void> {
		await this.context.workspaceState.update(STATS_STORAGE_KEY, stats);
	}

	private async writeLifetimeStats(stats: ContextBuildStats): Promise<void> {
		await this.context.globalState.update(STATS_STORAGE_KEY, stats);
	}

	private applyDelta(
		current: ContextBuildStats,
		delta: ContextBuildDelta
	): ContextBuildStats {
		return {
			totalOriginalTokens: safeAdd(
				current.totalOriginalTokens,
				delta.originalTokens
			),
			totalPreparedTokens: safeAdd(
				current.totalPreparedTokens,
				delta.preparedTokens
			),
			totalTokensSaved: safeAdd(
				current.totalTokensSaved,
				delta.tokensSaved
			),
			buildCount: safeAdd(current.buildCount, 1),
			totalSecretsRedacted: safeAdd(
				current.totalSecretsRedacted,
				delta.secretsRedacted
			),
		};
	}
}
