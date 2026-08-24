/**
 * Estimates context usage with a deliberately simple four-characters-per-token
 * heuristic. Exact tokenization depends on the receiving model.
 */
export function estimateTokens(text: string): number {
	return text.length === 0 ? 0 : Math.ceil(text.length / 4);
}
