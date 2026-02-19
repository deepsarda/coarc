import type { SupabaseClient } from "@supabase/supabase-js";
import {
	fetchCfRatingHistory,
	fetchCfSubmissions,
	fetchCfUserInfo,
} from "@/lib/services/codeforces";
import {
	fetchLcRecentSubmissions,
	fetchLcStats,
} from "@/lib/services/leetcode";

export interface SyncResult {
	cf: {
		success: boolean;
		error?: string;
		ratings?: number;
		submissions?: number;
	};
	lc: {
		success: boolean;
		error?: string;
		stats?: boolean;
		submissions?: number;
	};
}

/**
 * Sync all competitive programming data for a user.
 * Uses the admin client to bypass RLS.
 */
export async function syncUserStats(
	admin: SupabaseClient,
	userId: string,
	cfHandle: string | null,
	lcHandle: string | null,
): Promise<SyncResult> {
	const result: SyncResult = {
		cf: { success: false },
		lc: { success: false },
	};

	// Run CF and LC syncs concurrently
	const [cfResult, lcResult] = await Promise.allSettled([
		cfHandle ? syncCfData(admin, userId, cfHandle) : Promise.resolve(null),
		lcHandle ? syncLcData(admin, userId, lcHandle) : Promise.resolve(null),
	]);

	// Process CF result
	if (!cfHandle) {
		result.cf = { success: true, error: "No handle linked" };
	} else if (cfResult.status === "fulfilled" && cfResult.value) {
		result.cf = cfResult.value;
	} else if (cfResult.status === "rejected") {
		result.cf = { success: false, error: String(cfResult.reason) };
	}

	// Process LC result
	if (!lcHandle) {
		result.lc = { success: true, error: "No handle linked" };
	} else if (lcResult.status === "fulfilled" && lcResult.value) {
		result.lc = lcResult.value;
	} else if (lcResult.status === "rejected") {
		result.lc = { success: false, error: String(lcResult.reason) };
	}

	return result;
}

// Codeforces Sync

async function syncCfData(
	admin: SupabaseClient,
	userId: string,
	handle: string,
): Promise<SyncResult["cf"]> {
	try {
		// Fetch all data concurrently
		const [userInfo, ratings, submissions] = await Promise.all([
			fetchCfUserInfo(handle),
			fetchCfRatingHistory(handle),
			fetchCfSubmissions(handle, 200),
		]);

		// Upsert rating history
		if (ratings.length > 0) {
			const ratingsData = ratings.map((r) => ({
				user_id: userId,
				rating: r.newRating,
				contest_id: r.contestId,
				contest_name: r.contestName,
				rank: r.rank,
				old_rating: r.oldRating,
				new_rating: r.newRating,
				timestamp: r.timestamp.toISOString(),
			}));

			await admin
				.from("cf_ratings")
				.upsert(ratingsData, { onConflict: "user_id,contest_id" });
		}

		// Upsert submissions (only accepted ones for tracking)
		const acceptedSubs = submissions.filter((s) => s.verdict === "OK");
		if (acceptedSubs.length > 0) {
			const subsData = acceptedSubs.map((s) => ({
				user_id: userId,
				cf_submission_id: s.cfSubmissionId,
				problem_id: s.problemId,
				problem_name: s.problemName,
				problem_rating: s.problemRating,
				tags: s.tags,
				verdict: s.verdict,
				language: s.language,
				submitted_at: s.submittedAt.toISOString(),
			}));

			await admin
				.from("cf_submissions")
				.upsert(subsData, { onConflict: "cf_submission_id" });
		}

		// Upsert unique problems
		const uniqueProblems = new Map<
			string,
			{ id: string; name: string; rating: number | null; tags: string[] }
		>();
		for (const s of submissions) {
			if (!uniqueProblems.has(s.problemId)) {
				uniqueProblems.set(s.problemId, {
					id: s.problemId,
					name: s.problemName,
					rating: s.problemRating,
					tags: s.tags,
				});
			}
		}

		if (uniqueProblems.size > 0) {
			const problemsData = [...uniqueProblems.values()].map((p) => ({
				id: p.id,
				name: p.name,
				rating: p.rating,
				tags: p.tags,
			}));

			await admin
				.from("cf_problems")
				.upsert(problemsData, { onConflict: "id" });
		}

		// Update profile with latest rating info
		const latestRating = userInfo.rating;
		if (latestRating !== null) {
			await admin
				.from("profiles")
				.update({ updated_at: new Date().toISOString() })
				.eq("id", userId);
		}

		return {
			success: true,
			ratings: ratings.length,
			submissions: acceptedSubs.length,
		};
	} catch (err) {
		console.error(`CF sync failed for user ${userId}:`, err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown CF sync error",
		};
	}
}

// LeetCode Sync

async function syncLcData(
	admin: SupabaseClient,
	userId: string,
	handle: string,
): Promise<SyncResult["lc"]> {
	try {
		// Fetch stats and recent submissions concurrently
		const [stats, recentSubs] = await Promise.all([
			fetchLcStats(handle),
			fetchLcRecentSubmissions(handle, 50),
		]);

		// Upsert LC stats
		const statsData = {
			user_id: userId,
			easy_solved: stats.easySolved,
			medium_solved: stats.mediumSolved,
			hard_solved: stats.hardSolved,
			total_solved: stats.totalSolved,
			contest_rating: stats.contestRating,
			contest_ranking: stats.contestRanking,
			submission_calendar: stats.submissionCalendar,
			synced_at: new Date().toISOString(),
		};

		await admin.from("lc_stats").upsert(statsData, { onConflict: "user_id" });

		// Upsert recent submissions
		if (recentSubs.length > 0) {
			const subsData = recentSubs.map((s) => ({
				user_id: userId,
				problem_slug: s.problemSlug,
				problem_title: s.problemTitle,
				difficulty: s.difficulty,
				submitted_at: s.submittedAt.toISOString(),
				status: s.status,
			}));

			await admin.from("lc_submissions").upsert(subsData, {
				onConflict: "user_id,problem_slug,submitted_at",
			});
		}

		return {
			success: true,
			stats: true,
			submissions: recentSubs.length,
		};
	} catch (err) {
		console.error(`LC sync failed for user ${userId}:`, err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown LC sync error",
		};
	}
}
