import * as path from 'node:path';
import { Language, Parser, type Node } from 'web-tree-sitter';

type GrammarKey = 'typescript' | 'tsx' | 'javascript';

const BODY_NODE_TYPES = new Set([
	'method_definition',
	'function_declaration',
	'arrow_function',
	'function_item',
	'generator_function_declaration',
	'function_expression',
	'generator_function',
]);

const AXED_BODY_REPLACEMENT = '{}';
const COMMENT_NODE_TYPE = 'comment';

/** Node types whose `name` field is a meaningful code symbol for search. */
const SYMBOL_NODE_TYPES = new Set([
	'class_declaration',
	'abstract_class_declaration',
	'function_declaration',
	'generator_function_declaration',
	'method_definition',
	'interface_declaration',
	'type_alias_declaration',
	'enum_declaration',
	'variable_declarator',
]);

const JS_TS_EXTENSIONS = new Set([
	'.ts',
	'.tsx',
	'.js',
	'.jsx',
	'.mjs',
	'.cjs',
]);

let initialized = false;
let initPromise: Promise<void> | null = null;
const parsers: Partial<Record<GrammarKey, Parser>> = {};

function clearParsers(): void {
	for (const grammar of Object.keys(parsers) as GrammarKey[]) {
		parsers[grammar]?.delete();
		delete parsers[grammar];
	}
	initialized = false;
}

function grammarForExtension(ext: string): GrammarKey | null {
	switch (ext) {
		case '.ts':
			return 'typescript';
		case '.tsx':
			return 'tsx';
		case '.js':
		case '.jsx':
		case '.mjs':
		case '.cjs':
			return 'javascript';
		default:
			return null;
	}
}

function isJsTsFile(filePath: string): boolean {
	return JS_TS_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/** Whether Syntaxxed can build a parser-validated Outline for this file. */
export function supportsStructuralOutline(filePath: string): boolean {
	return isJsTsFile(filePath);
}

/**
 * Load web-tree-sitter and grammar WASM binaries from `wasmDir`.
 * Safe to call multiple times; subsequent calls reuse the same init promise.
 */
export function initializeAstParser(wasmDir: string): Promise<void> {
	if (initialized) {
		return Promise.resolve();
	}
	if (initPromise) {
		return initPromise;
	}

	const initialization = (async () => {
		const runtimeWasm = path.join(wasmDir, 'web-tree-sitter.wasm');
		await Parser.init({
			locateFile: () => runtimeWasm,
		});

		const grammarFiles: Record<GrammarKey, string> = {
			typescript: path.join(wasmDir, 'tree-sitter-typescript.wasm'),
			tsx: path.join(wasmDir, 'tree-sitter-tsx.wasm'),
			javascript: path.join(wasmDir, 'tree-sitter-javascript.wasm'),
		};

		for (const [key, wasmPath] of Object.entries(grammarFiles) as [
			GrammarKey,
			string,
		][]) {
			const language = await Language.load(wasmPath);
			const parser = new Parser();
			parser.setLanguage(language);
			parsers[key] = parser;
		}

		initialized = true;
	})();

	initPromise = initialization.catch((error: unknown) => {
		clearParsers();
		initPromise = null;
		console.warn('[Syntaxxed] Failed to initialize the source parser.', error);
		throw error;
	});

	return initPromise;
}

export function isAstParserReady(): boolean {
	return initialized;
}

/**
 * Wait for WASM grammars to finish loading. Returns false if init failed or
 * was never started.
 */
export function ensureAstParserReady(): Promise<boolean> {
	if (initialized) {
		return Promise.resolve(true);
	}
	if (!initPromise) {
		return Promise.resolve(false);
	}
	return initPromise.then(() => initialized).catch(() => false);
}

function findFunctionBody(node: Node): Node | null {
	// Explicitly locate the `{ ... }` statement block among the children.
	const block = node.children.find((c) => c?.type === 'statement_block');
	if (block) {
		return block;
	}

	// Arrow functions may have an expression body (no braces); the grammar
	// exposes it through the `body` field.
	return node.childForFieldName('body');
}

interface TextReplacement {
	start: number;
	end: number;
	replacement: string;
}

function collectBodyReplacements(node: Node): TextReplacement[] {
	const replacements: TextReplacement[] = [];

	if (BODY_NODE_TYPES.has(node.type)) {
		const body = findFunctionBody(node);
		if (body) {
			const replacement =
				body.type === 'statement_block'
					? AXED_BODY_REPLACEMENT
					: 'undefined';
			replacements.push({
				start: body.startIndex,
				end: body.endIndex,
				replacement,
			});
			// Skip traversing this node's children: the whole body is being
			// replaced, and nested function edits inside it would create
			// overlapping replacements that corrupt the output.
			return replacements;
		}
	}

	for (const child of node.children) {
		replacements.push(...collectBodyReplacements(child));
	}

	return replacements;
}

function commentReplacement(source: string): string {
	const lineBreakCount = source.match(/\n/g)?.length ?? 0;
	return lineBreakCount > 0 ? '\n'.repeat(lineBreakCount) : ' ';
}

function collectCommentReplacements(
	node: Node,
	source: string
): TextReplacement[] {
	if (node.type === COMMENT_NODE_TYPE) {
		return [
			{
				start: node.startIndex,
				end: node.endIndex,
				replacement: commentReplacement(
					source.slice(node.startIndex, node.endIndex)
				),
			},
		];
	}

	const replacements: TextReplacement[] = [];
	for (const child of node.children) {
		replacements.push(...collectCommentReplacements(child, source));
	}
	return replacements;
}

function applyReplacements(source: string, replacements: TextReplacement[]): string {
	if (replacements.length === 0) {
		return source;
	}

	const sorted = [...replacements].sort((a, b) => b.start - a.start);
	let result = source;
	for (const { start, end, replacement } of sorted) {
		if (start < 0 || end > result.length || start >= end) {
			continue;
		}
		result = result.slice(0, start) + replacement + result.slice(end);
	}
	return result;
}

function collectSymbols(node: Node, out: string[]): void {
	if (SYMBOL_NODE_TYPES.has(node.type)) {
		const name = node.childForFieldName('name');
		if (name) {
			out.push(name.text);
		}
	}

	for (const child of node.children) {
		collectSymbols(child, out);
	}
}

/**
 * Extract declared symbol names (classes, functions, methods, interfaces,
 * type aliases, enums, variables) from a JS/TS file. Returns an empty array
 * when the parser is unavailable or the file is not JS/TS.
 */
export function extractSymbols(content: string, filePath: string): string[] {
	if (!initialized || !isJsTsFile(filePath)) {
		return [];
	}

	const grammar = grammarForExtension(path.extname(filePath).toLowerCase());
	const parser = grammar ? parsers[grammar] : undefined;
	if (!parser) {
		return [];
	}

	try {
		const tree = parser.parse(content);
		if (!tree) {
			return [];
		}
		try {
			const symbols: string[] = [];
			collectSymbols(tree.rootNode, symbols);
			return symbols;
		} finally {
			tree.delete();
		}
	} catch (error) {
		console.warn(`Syntaxxed: symbol extraction failed for ${filePath}.`, error);
		return [];
	}
}

/**
 * Strip function/method implementations while preserving signatures,
 * classes, interfaces, and type aliases. Falls back to the original
 * source when parsing fails or the AST parser is unavailable.
 */
export function buildSourceOutline(content: string, filePath: string): string {
	if (!initialized) {
		console.warn(
			`[Syntaxxed] The source parser is not ready; Outline cannot remove implementation bodies in ${filePath}.`
		);
		return content;
	}
	if (!isJsTsFile(filePath)) {
		return content;
	}

	const grammar = grammarForExtension(path.extname(filePath).toLowerCase());
	if (!grammar) {
		return content;
	}

	const parser = parsers[grammar];
	if (!parser) {
		return content;
	}

	try {
		const tree = parser.parse(content);
		if (!tree) {
			return content;
		}

		try {
			const replacements = collectBodyReplacements(tree.rootNode);
			return applyReplacements(content, replacements);
		} finally {
			tree.delete();
		}
	} catch (error) {
		console.warn(`Syntaxxed: Outline generation failed for ${filePath}.`, error);
		return content;
	}
}

/**
 * Agent-facing Outline transformation that fails closed instead of returning the
 * original source when structural pruning cannot be guaranteed.
 */
export function buildSourceOutlineStrict(
	content: string,
	filePath: string
): string {
	if (!initialized) {
		throw new Error('The structural Outline parser is unavailable.');
	}
	if (!isJsTsFile(filePath)) {
		throw new Error(
			'Outline is not supported for this file type. Request Logic or Source ' +
				'so the developer can approve implementation access.'
		);
	}

	const grammar = grammarForExtension(path.extname(filePath).toLowerCase());
	const parser = grammar ? parsers[grammar] : undefined;
	if (!parser) {
		throw new Error('The structural Outline grammar is unavailable.');
	}

	let tree;
	try {
		tree = parser.parse(content);
	} catch {
		throw new Error('Outline generation failed; the file was not disclosed.');
	}
	if (!tree) {
		throw new Error('Outline generation failed; the file was not disclosed.');
	}

	try {
		if (tree.rootNode.hasError) {
			throw new Error(
				'Outline generation found invalid syntax; the file was not disclosed.'
			);
		}
		return applyReplacements(
			content,
			collectBodyReplacements(tree.rootNode)
		);
	} finally {
		tree.delete();
	}
}

/**
 * Remove only parser-recognized comments from JavaScript and TypeScript.
 * String, template-literal, and regular-expression contents are never scanned
 * with text regexes, so comment-like text inside literals remains unchanged.
 */
export function removeCodeComments(content: string, filePath: string): string {
	if (!initialized || !isJsTsFile(filePath)) {
		return content;
	}

	const grammar = grammarForExtension(path.extname(filePath).toLowerCase());
	const parser = grammar ? parsers[grammar] : undefined;
	if (!parser) {
		return content;
	}

	try {
		const tree = parser.parse(content);
		if (!tree) {
			return content;
		}

		try {
			return applyReplacements(
				content,
				collectCommentReplacements(tree.rootNode, content)
			);
		} finally {
			tree.delete();
		}
	} catch (error) {
		console.warn(`Syntaxxed: comment removal failed for ${filePath}.`, error);
		return content;
	}
}
