import * as assert from 'node:assert/strict';
import type * as vscode from 'vscode';
import { StatsManager } from '../statsManager';

function createMemento(): vscode.Memento {
	const values = new Map<string, unknown>();
	return {
		get<T>(key: string, defaultValue?: T): T | undefined {
			return (values.has(key) ? values.get(key) : defaultValue) as
				| T
				| undefined;
		},
		update(key: string, value: unknown): Thenable<void> {
			if (value === undefined) {
				values.delete(key);
			} else {
				values.set(key, value);
			}
			return Promise.resolve();
		},
		keys(): readonly string[] {
			return [...values.keys()];
		},
	};
}

suite('Stats manager', () => {
	test('tracks session, workspace, and lifetime token journeys', async () => {
		const context = {
			workspaceState: createMemento(),
			globalState: createMemento(),
		} as unknown as vscode.ExtensionContext;
		const manager = new StatsManager(context);

		await manager.recordBuild(42_000, 6_100, 35_900, 2);
		const first = manager.getStats();
		assert.equal(first.session.totalOriginalTokens, 42_000);
		assert.equal(first.session.totalPreparedTokens, 6_100);
		assert.equal(first.workspace.totalTokensSaved, 35_900);
		assert.equal(first.lifetime.totalSecretsRedacted, 2);

		await manager.recordBuild(8_000, 2_000, 6_000, 0);
		const second = manager.getStats();
		assert.equal(second.session.buildCount, 2);
		assert.equal(second.session.totalOriginalTokens, 50_000);
		assert.equal(second.session.totalPreparedTokens, 8_100);

		await manager.resetAllStats();
		assert.equal(manager.getStats().session.buildCount, 0);
	});
});
