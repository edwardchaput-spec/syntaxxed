import * as vscode from 'vscode';

/** Translate the active VS Code workspace into engine-owned local paths. */
export function getWorkspaceRoots(): string[] {
	const roots = (vscode.workspace.workspaceFolders ?? []).map(
		(folder) => folder.uri.fsPath
	);
	if (roots.length === 0) {
		throw new Error('Open a workspace folder before running Syntaxxed.');
	}
	return roots;
}
