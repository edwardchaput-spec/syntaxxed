import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

suite('Extension', () => {
	test('registers its public commands', async () => {
		const extension = vscode.extensions.getExtension('syntaxxed.syntaxxed');
		assert.ok(extension);
		await extension.activate();

		const commands = await vscode.commands.getCommands(true);

		assert.ok(commands.includes('syntaxxed.buildContext'));
		assert.ok(commands.includes('syntaxxed.openSidebar'));
		assert.ok(commands.includes('syntaxxed.createConfig'));
		assert.ok(commands.includes('syntaxxed.openAgentGuide'));
		assert.ok(commands.includes('syntaxxed.openQuickStart'));
		assert.ok(commands.includes('syntaxxed.enableGateway'));
		assert.ok(commands.includes('syntaxxed.disableGateway'));
		assert.ok(commands.includes('syntaxxed.gatewayStatus'));
	});
});
