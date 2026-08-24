import * as vscode from 'vscode';
import {
	DEFAULT_INPUT_COST_PER_MILLION,
	normalizeCustomRedactionRules,
	TOKEN_BUDGET_THRESHOLD,
	type CustomRedactionRule,
} from './engine';

export interface SyntaxxedExtensionSettings {
	tokenBudgetWarningThreshold: number;
	inputCostPerMillionTokens: number;
	customRedactionRules: CustomRedactionRule[];
	invalidCustomRedactionRuleCount: number;
}

function normalizeNumber(
	value: unknown,
	fallback: number,
	minimum: number,
	maximum: number
): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.min(Math.max(value, minimum), maximum)
		: fallback;
}

export function getExtensionSettings(): SyntaxxedExtensionSettings {
	const configuration = vscode.workspace.getConfiguration('syntaxxed');
	const customRules = normalizeCustomRedactionRules(
		configuration.get<unknown>('customRedactionRules')
	);

	return {
		tokenBudgetWarningThreshold: Math.floor(
			normalizeNumber(
				configuration.get<unknown>('tokenBudgetWarningThreshold'),
				TOKEN_BUDGET_THRESHOLD,
				1_000,
				2_000_000
			)
		),
		inputCostPerMillionTokens: normalizeNumber(
			configuration.get<unknown>('inputCostPerMillionTokens'),
			DEFAULT_INPUT_COST_PER_MILLION,
			0,
			1_000
		),
		customRedactionRules: customRules.rules,
		invalidCustomRedactionRuleCount: customRules.invalidCount,
	};
}
