/**
 * Extract a Codeforces handle from raw input.
 * Accepts:
 *   - "tourist"
 *   - "https://codeforces.com/profile/tourist"
 *   - "codeforces.com/profile/tourist/"
 *   - "http://www.codeforces.com/profile/tourist"
 * Returns null if the input is empty after extraction.
 */
export function extractCfHandle(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	// Match URLs like codeforces.com/profile/<handle>
	const urlMatch = trimmed.match(
		/(?:https?:\/\/)?(?:www\.)?codeforces\.com\/profile\/([A-Za-z0-9_.-]+)/i,
	);
	if (urlMatch) return urlMatch[1];

	// If it looks like a URL but doesn't match the pattern, it's invalid
	if (trimmed.includes('codeforces.com')) return null;

	// Otherwise treat the entire input as a handle (no spaces allowed)
	if (/^[A-Za-z0-9_.-]+$/.test(trimmed)) return trimmed;

	return null;
}

/**
 * Extract a LeetCode handle from raw input.
 * Accepts:
 *   - "neal_wu"
 *   - "https://leetcode.com/u/neal_wu/"
 *   - "https://leetcode.com/neal_wu/"       (old format)
 *   - "leetcode.com/u/neal_wu"
 * Returns null if the input is empty after extraction.
 */
export function extractLcHandle(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	// Match URLs like leetcode.com/u/<handle> or leetcode.com/<handle>
	const urlMatch = trimmed.match(
		/(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([A-Za-z0-9_-]+)\/?$/i,
	);
	if (urlMatch) return urlMatch[1];

	// If it looks like a URL but doesn't match the pattern, it's invalid
	if (trimmed.includes('leetcode.com')) return null;

	// Otherwise treat the entire input as a handle
	if (/^[A-Za-z0-9_-]+$/.test(trimmed)) return trimmed;

	return null;
}
