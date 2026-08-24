export interface SecretScanResult {
	redactedText: string;
	secretCount: number;
}

export interface CustomRedactionRule {
	readonly name: string;
	readonly pattern: string;
	readonly flags: string;
}

export interface CustomRedactionRuleSet {
	readonly rules: CustomRedactionRule[];
	readonly invalidCount: number;
}

interface SecretPattern {
	readonly expression: RegExp;
	readonly shouldRedact?: (match: RegExpExecArray) => boolean;
}

interface TextRange {
	start: number;
	end: number;
}

const REDACTED_SECRET = '[REDACTED_SECRET]';
const MAX_GENERIC_SECRET_LENGTH = 4_096;
const MAX_CUSTOM_RULES = 64;
const MAX_CUSTOM_RULE_NAME_LENGTH = 80;
const MAX_CUSTOM_PATTERN_LENGTH = 512;
const MAX_SECRET_MATCHES = 10_000;

const SECRET_REFERENCE_PATTERN =
	/^(?:process\.env(?:\.|\[)|import\.meta\.env(?:\.|\[)|Deno\.env\.get\(|Bun\.env\.|\$\{|%[A-Z][A-Z0-9_]*%$)/i;
const PLACEHOLDER_PATTERN =
	/^(?:<[^>]+>|your[-_ ]|example|sample|dummy|fake|placeholder|replace[-_ ]?me|change[-_ ]?me|test[-_ ]?(?:key|token|secret|password)?$|x{4,}$)/i;

/**
 * Provider-specific formats are intentionally conservative. Generic
 * assignments are handled separately so passwords containing punctuation are
 * covered without treating every high-entropy string as a secret.
 */
const SECRET_PATTERNS: readonly SecretPattern[] = [
	{
		expression:
			/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
	},
	{
		expression:
			/\b(?:AWS[_-]?)?SECRET[_-]?ACCESS[_-]?KEY\b\s*[:=]\s*["']?[A-Za-z0-9/+=]{40}["']?/gi,
	},
	{
		expression:
			/\bgh[pousr]_[A-Za-z0-9]{36,255}\b/g,
	},
	{
		expression:
			/\bgithub_pat_[A-Za-z0-9_]{50,255}\b/g,
	},
	{
		expression:
			/\bglpat-[A-Za-z0-9_-]{20,255}\b/g,
	},
	{
		expression:
			/\bsk-(?:proj-|svcacct-|ant-(?:api\d{2}-)?)?[A-Za-z0-9_-]{20,255}\b/g,
	},
	{
		expression:
			/\bAIza[0-9A-Za-z_-]{35}\b/g,
	},
	{
		expression:
			/\bxox(?:a|b|p|r|s)-[A-Za-z0-9-]{10,255}\b/g,
	},
	{
		expression:
			/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,255}\b/g,
	},
	{
		expression:
			/\b(?:shpat|shpca|shppa|shpss)_[A-Fa-f0-9]{32}\b/g,
	},
	{
		expression:
			/\bnpm_[A-Za-z0-9]{36}\b/g,
	},
	{
		expression:
			/\bpypi-[A-Za-z0-9_-]{30,255}\b/g,
	},
	{
		expression:
			/\bSG\.[A-Za-z0-9_-]{16,255}\.[A-Za-z0-9_-]{20,255}\b/g,
	},
	{
		expression:
			/\bSK[A-Fa-f0-9]{32}\b/g,
	},
	{
		expression:
			/\beyJ[A-Za-z0-9_-]{8,4096}\.[A-Za-z0-9_-]{8,4096}\.[A-Za-z0-9_-]{8,4096}\b/g,
	},
	{
		expression:
			/\bBearer\s+[A-Za-z0-9._~+/=-]{16,4096}\b/gi,
	},
	{
		expression:
			/\bBasic\s+[A-Za-z0-9+/]{12,4096}={0,2}\b/gi,
	},
	{
		expression:
			/\b(?:https?|mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s/:@]{1,128}:[^\s/@]{1,512}@/gi,
	},
	{
		expression:
			/-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
	},
	{
		expression:
			/\b(?:AccountKey|SharedAccessKey|SharedAccessSignature)\s*=\s*[^;\s]{16,4096}/gi,
	},
	{
		expression:
			new RegExp(
				String.raw`\b(?:[A-Z0-9]+[_-])*(?:api[_-]?key|apikey|secret[_-]?(?:key|token)|access[_-]?token|auth[_-]?token|client[_-]?secret|private[_-]?key|password|passwd|pwd|database[_-]?url|connection[_-]?string|webhook[_-]?secret|signing[_-]?secret)\b\s*[:=]\s*(?:"([^"\r\n]{8,${MAX_GENERIC_SECRET_LENGTH}})"|'([^'\r\n]{8,${MAX_GENERIC_SECRET_LENGTH}})'|([^\s,;}\]]{8,${MAX_GENERIC_SECRET_LENGTH}}))`,
				'gi'
			),
		shouldRedact: (match) => {
			const value = match[1] ?? match[2] ?? match[3] ?? '';
			return !isSafeReferenceOrPlaceholder(value);
		},
	},
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function normalizeFlags(value: unknown): string | undefined {
	if (value === undefined || value === '') {
		return 'g';
	}
	if (typeof value !== 'string' || !/^[gimsu]+$/.test(value)) {
		return undefined;
	}

	return [...new Set(`g${value}`)].join('');
}

/**
 * Reject the most common catastrophic-backtracking constructs. Custom rules
 * run in the extension host, so expressions with nested variable quantifiers,
 * backreferences, or lookbehind are deliberately not accepted.
 */
function hasUnsafeStructure(pattern: string): boolean {
	const structural = pattern
		.replace(/\\./g, '')
		.replace(/\[(?:\\.|[^\]])*\]/g, '');
	return (
		/\\[1-9]|\\k</.test(pattern) ||
		/\(\?<(?=[=!])/.test(pattern) ||
		/\([^)]*(?:[+*]|\{\d+,\})[^)]*\)(?:[+*]|\{\d+,?\d*\})/.test(
			structural
		)
	);
}

/** Normalize and pre-compile user settings before any workspace text is read. */
export function normalizeCustomRedactionRules(
	value: unknown
): CustomRedactionRuleSet {
	if (!Array.isArray(value)) {
		return { rules: [], invalidCount: 0 };
	}

	const rules: CustomRedactionRule[] = [];
	let invalidCount = Math.max(0, value.length - MAX_CUSTOM_RULES);

	for (const candidate of value.slice(0, MAX_CUSTOM_RULES)) {
		if (!isRecord(candidate)) {
			invalidCount++;
			continue;
		}

		const name =
			typeof candidate.name === 'string' ? candidate.name.trim() : '';
		const pattern =
			typeof candidate.pattern === 'string' ? candidate.pattern.trim() : '';
		const flags = normalizeFlags(candidate.flags);
		if (
			name.length === 0 ||
			name.length > MAX_CUSTOM_RULE_NAME_LENGTH ||
			pattern.length === 0 ||
			pattern.length > MAX_CUSTOM_PATTERN_LENGTH ||
			flags === undefined ||
			hasUnsafeStructure(pattern)
		) {
			invalidCount++;
			continue;
		}

		try {
			void new RegExp(pattern, flags);
			rules.push({ name, pattern, flags });
		} catch {
			invalidCount++;
		}
	}

	return { rules, invalidCount };
}

function isSafeReferenceOrPlaceholder(value: string): boolean {
	const normalized = value.trim();
	return (
		normalized.length === 0 ||
		SECRET_REFERENCE_PATTERN.test(normalized) ||
		PLACEHOLDER_PATTERN.test(normalized)
	);
}

function mergeRanges(ranges: readonly TextRange[]): TextRange[] {
	if (ranges.length === 0) {
		return [];
	}

	const sorted = [...ranges].sort((left, right) => left.start - right.start);
	const first = sorted[0];
	if (!first) {
		return [];
	}
	const merged: TextRange[] = [{ ...first }];

	for (const current of sorted.slice(1)) {
		const previous = merged.at(-1);
		if (!previous) {
			merged.push({ ...current });
			continue;
		}

		if (current.start <= previous.end) {
			previous.end = Math.max(previous.end, current.end);
		} else {
			merged.push({ ...current });
		}
	}

	return merged;
}

function collectSecretRanges(
	text: string,
	customRules: readonly CustomRedactionRule[]
): TextRange[] {
	const ranges: TextRange[] = [];
	const customPatterns: SecretPattern[] = customRules.map((rule) => ({
		expression: new RegExp(rule.pattern, rule.flags),
	}));

	for (const pattern of [...SECRET_PATTERNS, ...customPatterns]) {
		const flags = pattern.expression.flags.includes('g')
			? pattern.expression.flags
			: `${pattern.expression.flags}g`;
		const expression = new RegExp(pattern.expression.source, flags);

		for (const match of text.matchAll(expression)) {
			if (
				match.index === undefined ||
				match[0].length === 0 ||
				(pattern.shouldRedact && !pattern.shouldRedact(match))
			) {
				continue;
			}

			ranges.push({
				start: match.index,
				end: match.index + match[0].length,
			});
			if (ranges.length >= MAX_SECRET_MATCHES) {
				return mergeRanges(ranges);
			}
		}
	}

	return mergeRanges(ranges);
}

/**
 * Replaces recognized credential material with a stable marker. Overlapping
 * matches are merged so each source span contributes once to the total.
 */
export function redactSecrets(
	text: string,
	customRules: readonly CustomRedactionRule[] = []
): SecretScanResult {
	const ranges = collectSecretRanges(text, customRules);
	if (ranges.length === 0) {
		return { redactedText: text, secretCount: 0 };
	}

	let redactedText = text;
	for (const range of [...ranges].reverse()) {
		redactedText =
			redactedText.slice(0, range.start) +
			REDACTED_SECRET +
			redactedText.slice(range.end);
	}

	return {
		redactedText,
		secretCount: ranges.length,
	};
}
