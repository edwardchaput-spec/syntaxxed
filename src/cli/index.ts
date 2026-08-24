#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { Command, Option } from 'commander';
import {
	buildWorkspaceContext,
	initializeAstParser,
	type ContextBuildResult,
	type ContextDetail,
} from '../engine';

interface CliOptions {
	detail: ContextDetail;
	intent?: string;
	out: string;
	dir: string;
}

const CONTEXT_DETAILS: readonly ContextDetail[] = [
	'outline',
	'logic',
	'source',
];
const MAX_INTENT_LENGTH = 512;

function isGitHubActions(environment: NodeJS.ProcessEnv): boolean {
	return environment.GITHUB_ACTIONS === 'true';
}

function getEnvironmentValue(
	environment: NodeJS.ProcessEnv,
	name: string
): string | undefined {
	const value = environment[name]?.trim();
	return value === undefined || value.length === 0 ? undefined : value;
}

function getDefaultDirectory(environment: NodeJS.ProcessEnv): string {
	if (isGitHubActions(environment)) {
		const workspace = getEnvironmentValue(environment, 'GITHUB_WORKSPACE');
		if (workspace !== undefined) {
			return workspace;
		}
	}

	return process.cwd();
}

function hasOption(
	argv: readonly string[],
	shortFlag: string,
	longFlag: string
): boolean {
	return argv.slice(2).some(
		(argument) =>
			argument === shortFlag ||
			argument.startsWith(`${shortFlag}=`) ||
			argument === longFlag ||
			argument.startsWith(`${longFlag}=`)
	);
}

function applyGitHubActionInputs(
	argv: readonly string[],
	environment: NodeJS.ProcessEnv
): string[] {
	const resolvedArgv = [...argv];
	if (!isGitHubActions(environment)) {
		return resolvedArgv;
	}

	const inputs = [
		{
			name: 'INPUT_DETAIL',
			shortFlag: '-l',
			longFlag: '--detail',
		},
		{
			name: 'INPUT_INTENT',
			shortFlag: '-i',
			longFlag: '--intent',
		},
		{
			name: 'INPUT_OUT',
			shortFlag: '-o',
			longFlag: '--out',
		},
	] as const;

	for (const input of inputs) {
		const value = getEnvironmentValue(environment, input.name);
		if (
			value !== undefined &&
			!hasOption(resolvedArgv, input.shortFlag, input.longFlag)
		) {
			resolvedArgv.push(input.longFlag, value);
		}
	}

	return resolvedArgv;
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function getAstWasmDirectory(): string {
	return path.resolve(__dirname, '..', '..', 'media', 'tree-sitter');
}

function normalizeIntent(intent: string | undefined): string | undefined {
	if (intent === undefined) {
		return undefined;
	}

	const normalized = intent.trim();
	if (normalized.length === 0) {
		throw new Error('--intent must contain a non-empty search query.');
	}
	if (normalized.length > MAX_INTENT_LENGTH) {
		throw new Error(
			`--intent cannot exceed ${MAX_INTENT_LENGTH.toLocaleString()} characters.`
		);
	}
	return normalized;
}

function getOutputIgnorePattern(
	workspaceRoot: string,
	outputPath: string
): string | undefined {
	const relativePath = path.relative(workspaceRoot, outputPath);
	if (
		relativePath.length === 0 ||
		relativePath === '..' ||
		relativePath.startsWith(`..${path.sep}`) ||
		path.isAbsolute(relativePath)
	) {
		return undefined;
	}
	return relativePath.replace(/\\/g, '/');
}

async function prepareSourceParser(
	detail: ContextDetail,
	intent: string | undefined
): Promise<void> {
	if (detail === 'source' && intent === undefined) {
		return;
	}

	try {
		await initializeAstParser(getAstWasmDirectory());
	} catch (error) {
		throw new Error(
			`Could not initialize Syntaxxed's source parser: ${getErrorMessage(error)}`
		);
	}
}

async function writePayload(outputPath: string, payload: string): Promise<void> {
	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(outputPath, payload, 'utf8');
}

function printSuccess(result: ContextBuildResult, outputPath: string): void {
	const percentSaved =
		result.originalTokens > 0
			? (result.tokensSaved / result.originalTokens) * 100
			: 0;
	console.log(`Syntaxxed built context from ${result.fileCount.toLocaleString()} file(s) at ${outputPath}`);
	console.log(
		`Token Savings: ${result.originalTokens.toLocaleString()} -> ` +
			`${result.preparedTokens.toLocaleString()} ` +
			`(-${result.tokensSaved.toLocaleString()}, ${percentSaved.toFixed(1)}%)`
	);
	console.log(`Secrets Redacted: ${result.secretsRedacted.toLocaleString()}`);
}

function formatGitHubOutput(name: string, value: string): string {
	const delimiter = `syntaxxed_${randomUUID()}`;
	return `${name}<<${delimiter}\n${value}\n${delimiter}\n`;
}

async function writeGitHubActionsReport(
	result: ContextBuildResult,
	outputPath: string,
	environment: NodeJS.ProcessEnv
): Promise<void> {
	if (!isGitHubActions(environment)) {
		return;
	}

	const summaryPath = getEnvironmentValue(
		environment,
		'GITHUB_STEP_SUMMARY'
	);
	if (summaryPath !== undefined) {
		const summary = [
			'## Syntaxxed context build',
			'',
			'| Metric | Result |',
			'| --- | ---: |',
			`| Tokens Saved | ${result.tokensSaved.toLocaleString()} |`,
			`| Secrets Redacted | ${result.secretsRedacted.toLocaleString()} |`,
			'',
		].join('\n');
		await appendFile(summaryPath, summary, 'utf8');
	}

	const githubOutputPath = getEnvironmentValue(environment, 'GITHUB_OUTPUT');
	if (githubOutputPath !== undefined) {
		await appendFile(
			githubOutputPath,
			[
				formatGitHubOutput('output-path', outputPath),
				formatGitHubOutput('tokens-saved', String(result.tokensSaved)),
				formatGitHubOutput(
					'secrets-redacted',
					String(result.secretsRedacted)
				),
			].join(''),
			'utf8'
		);
	}
}

async function execute(
	options: CliOptions,
	environment: NodeJS.ProcessEnv
): Promise<void> {
	const workspaceRoot = path.resolve(options.dir);
	const outputPath = path.resolve(options.out);
	const intent = normalizeIntent(options.intent);
	await prepareSourceParser(options.detail, intent);

	const outputIgnorePattern = getOutputIgnorePattern(
		workspaceRoot,
		outputPath
	);
	const result = await buildWorkspaceContext({
		workspaceRoots: [workspaceRoot],
		source: 'cli',
		detail: options.detail,
		...(intent === undefined ? {} : { intent }),
		...(outputIgnorePattern === undefined
			? {}
			: { excludePatterns: [outputIgnorePattern] }),
	});

	if (result.fileCount === 0) {
		throw new Error(
			intent
				? `No files matched the intent query: ${intent}`
				: `No eligible files were found in ${workspaceRoot}`
		);
	}

	await writePayload(outputPath, result.payload);
	printSuccess(result, outputPath);
	await writeGitHubActionsReport(result, outputPath, environment);
}

export function createCliProgram(
	environment: NodeJS.ProcessEnv = process.env
): Command {
	return new Command()
		.name('syntaxxed')
		.description(
			'Build focused, redacted repository context for AI coding tools.'
		)
		.addOption(
			new Option('-l, --detail <level>', 'context detail level')
				.choices(CONTEXT_DETAILS)
				.default('logic')
		)
		.option('-i, --intent <query>', 'select files relevant to this task')
		.requiredOption(
			'-o, --out <filepath>',
			'write the prepared Markdown context to this file'
		)
		.option(
			'-d, --dir <directory>',
			'target workspace directory',
			getDefaultDirectory(environment)
		)
		.showSuggestionAfterError()
		.action(async (options: CliOptions) => execute(options, environment));
}

export async function runCli(
	argv: readonly string[] = process.argv,
	environment: NodeJS.ProcessEnv = process.env
): Promise<void> {
	await createCliProgram(environment).parseAsync(
		applyGitHubActionInputs(argv, environment)
	);
}

const invokedPath = process.argv[1];
if (
	invokedPath !== undefined &&
	path.resolve(invokedPath) === path.resolve(__filename)
) {
	void runCli().catch((error: unknown) => {
		console.error(`Syntaxxed: ${getErrorMessage(error)}`);
		process.exitCode = 1;
	});
}
