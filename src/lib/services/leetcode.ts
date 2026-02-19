import { LeetCode } from 'leetcode-query';

const lc = new LeetCode();

export interface LcUserStats {
	easySolved: number;
	mediumSolved: number;
	hardSolved: number;
	totalSolved: number;
	contestRating: number | null;
	contestRanking: number | null;
	submissionCalendar: Record<string, number> | null;
}

export interface LcRecentSubmission {
	problemSlug: string;
	problemTitle: string;
	difficulty: string;
	submittedAt: Date;
	status: string;
}

/**
 * Fetch comprehensive LeetCode stats for a user.
 */
export async function fetchLcStats(handle: string): Promise<LcUserStats> {
	const profile = await lc.user(handle);

	const user = profile.matchedUser;
	if (!user) {
		throw new Error(`LeetCode user "${handle}" not found`);
	}

	const acStats = user.submitStats?.acSubmissionNum ?? [];
	const getCount = (diff: string) => acStats.find((s) => s.difficulty === diff)?.count ?? 0;

	const easy = getCount('Easy');
	const medium = getCount('Medium');
	const hard = getCount('Hard');

	let calendar: Record<string, number> | null = null;
	try {
		calendar = user.submissionCalendar ? JSON.parse(user.submissionCalendar) : null;
	} catch {
		calendar = null;
	}

	// Fetch contest info separately (it's a different query)
	let contestRating: number | null = null;
	let contestRanking: number | null = null;
	try {
		const contestInfo = await lc.user_contest_info(handle);
		if (contestInfo.userContestRanking) {
			contestRating = contestInfo.userContestRanking.rating ?? null;
			contestRanking = contestInfo.userContestRanking.globalRanking ?? null;
		}
	} catch {
		// Contest info may not exist for users who haven't participated
	}

	return {
		easySolved: easy,
		mediumSolved: medium,
		hardSolved: hard,
		totalSolved: easy + medium + hard,
		contestRating,
		contestRanking,
		submissionCalendar: calendar,
	};
}

/**
 * Fetch recent accepted submissions from LeetCode.
 */
export async function fetchLcRecentSubmissions(
	handle: string,
	limit = 20,
): Promise<LcRecentSubmission[]> {
	const submissions = await lc.recent_submissions(handle, limit);

	return submissions.map((s) => ({
		problemSlug: s.titleSlug,
		problemTitle: s.title,
		difficulty: 'Unknown', // Not available in recent_submissions, filled by stats
		submittedAt: new Date(Number(s.timestamp) * 1000),
		status: s.statusDisplay,
	}));
}

/**
 * Quick check: does this LeetCode handle exist?
 */
export async function verifyLcHandle(handle: string): Promise<boolean> {
	try {
		const profile = await lc.user(handle);
		return !!profile.matchedUser;
	} catch {
		return false;
	}
}
