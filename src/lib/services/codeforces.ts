const CF_API = "https://codeforces.com/api";
const TIMEOUT_MS = 10_000;

export interface CfUserInfo {
	handle: string;
	rating: number | null;
	maxRating: number | null;
	rank: string | null;
	maxRank: string | null;
}

export interface CfRatingChange {
	contestId: number;
	contestName: string;
	rank: number;
	oldRating: number;
	newRating: number;
	timestamp: Date;
}

export interface CfSubmission {
	cfSubmissionId: number;
	problemId: string;
	problemName: string;
	problemRating: number | null;
	tags: string[];
	verdict: string;
	language: string;
	submittedAt: Date;
}

/**
 * Fetch user info from Codeforces.
 */
export async function fetchCfUserInfo(handle: string): Promise<CfUserInfo> {
	const res = await fetch(
		`${CF_API}/user.info?handles=${encodeURIComponent(handle)}`,
		{ signal: AbortSignal.timeout(TIMEOUT_MS) },
	);

	if (!res.ok) {
		throw new Error(`Codeforces API returned ${res.status}`);
	}

	const data = await res.json();
	if (data.status !== "OK" || !data.result?.[0]) {
		throw new Error(`Codeforces user "${handle}" not found`);
	}

	const user = data.result[0];
	return {
		handle: user.handle,
		rating: user.rating ?? null,
		maxRating: user.maxRating ?? null,
		rank: user.rank ?? null,
		maxRank: user.maxRank ?? null,
	};
}

/**
 * Fetch rating history from Codeforces.
 */
export async function fetchCfRatingHistory(
	handle: string,
): Promise<CfRatingChange[]> {
	const res = await fetch(
		`${CF_API}/user.rating?handle=${encodeURIComponent(handle)}`,
		{ signal: AbortSignal.timeout(TIMEOUT_MS) },
	);

	if (!res.ok) {
		throw new Error(`Codeforces API returned ${res.status}`);
	}

	const data = await res.json();
	if (data.status !== "OK") {
		throw new Error(`Failed to fetch CF ratings for "${handle}"`);
	}

	return (data.result ?? []).map(
		(r: {
			contestId: number;
			contestName: string;
			rank: number;
			oldRating: number;
			newRating: number;
			ratingUpdateTimeSeconds: number;
		}) => ({
			contestId: r.contestId,
			contestName: r.contestName,
			rank: r.rank,
			oldRating: r.oldRating,
			newRating: r.newRating,
			timestamp: new Date(r.ratingUpdateTimeSeconds * 1000),
		}),
	);
}

/**
 * Fetch recent submissions from Codeforces (last `count` submissions).
 */
export async function fetchCfSubmissions(
	handle: string,
	count = 100,
): Promise<CfSubmission[]> {
	const res = await fetch(
		`${CF_API}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`,
		{ signal: AbortSignal.timeout(TIMEOUT_MS) },
	);

	if (!res.ok) {
		throw new Error(`Codeforces API returned ${res.status}`);
	}

	const data = await res.json();
	if (data.status !== "OK") {
		throw new Error(`Failed to fetch CF submissions for "${handle}"`);
	}

	return (data.result ?? []).map(
		(s: {
			id: number;
			problem: {
				contestId?: number;
				index: string;
				name: string;
				rating?: number;
				tags?: string[];
			};
			verdict: string;
			programmingLanguage: string;
			creationTimeSeconds: number;
		}) => ({
			cfSubmissionId: s.id,
			problemId: `${s.problem.contestId ?? 0}${s.problem.index}`,
			problemName: s.problem.name,
			problemRating: s.problem.rating ?? null,
			tags: s.problem.tags ?? [],
			verdict: s.verdict,
			language: s.programmingLanguage,
			submittedAt: new Date(s.creationTimeSeconds * 1000),
		}),
	);
}
