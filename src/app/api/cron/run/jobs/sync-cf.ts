import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { updateUserStreak } from "@/lib/gamification/streaks";
import { syncUserStats } from "@/lib/services/sync";

/**
 * Sync Codeforces data for all users with cf_handle set.
 * After syncing, backfills any missing problems in cf_problems cache.
 * 1s delay between users to avoid rate-limiting.
 */
export async function syncAllCf(admin: SupabaseClient) {
	const { data: users } = await admin
		.from("profiles")
		.select("id, cf_handle, lc_handle")
		.not("cf_handle", "is", null);

	if (!users || users.length === 0) return { synced: 0 };

	let synced = 0;
	const errors: string[] = [];

	for (const user of users) {
		try {
			const result = await syncUserStats(
				admin,
				user.id,
				user.cf_handle,
				null, // don't sync LC in this job
			);

			if (result.cf.success) {
				synced++;
				// Update streak and check badges
				await updateUserStreak(admin, user.id);
				await checkAndAwardBadges(admin, user.id);
			} else if (result.cf.error) {
				errors.push(`${user.cf_handle}: ${result.cf.error}`);
			}
		} catch (err) {
			errors.push(
				`${user.cf_handle}: ${err instanceof Error ? err.message : "Unknown"}`,
			);
		}

		// Rate-limit: 1s between users
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	// Backfill missing CF problems from submissions
	const backfilled = await backfillMissingCfProblems(admin);

	return {
		synced,
		total: users.length,
		backfilled,
		errors: errors.slice(0, 10),
	};
}

/**
 * Find CF problem IDs in cf_submissions that aren't in cf_problems yet,
 * and fetch their metadata from the CF API.
 */
async function backfillMissingCfProblems(admin: SupabaseClient) {
	// Get distinct problem IDs from submissions
	const { data: submissionProblems } = await admin
		.from("cf_submissions")
		.select("problem_id, problem_name, problem_rating, tags")
		.limit(2000);

	if (!submissionProblems || submissionProblems.length === 0) return 0;

	// Deduplicate
	const problemMap = new Map<
		string,
		{ id: string; name: string; rating: number | null; tags: string[] }
	>();
	for (const s of submissionProblems) {
		if (!problemMap.has(s.problem_id)) {
			problemMap.set(s.problem_id, {
				id: s.problem_id,
				name: s.problem_name,
				rating: s.problem_rating,
				tags: s.tags ?? [],
			});
		}
	}

	// Check which are already cached
	const allIds = [...problemMap.keys()];
	const { data: existingProblems } = await admin
		.from("cf_problems")
		.select("id")
		.in("id", allIds.slice(0, 1000));

	const existingSet = new Set((existingProblems ?? []).map((p) => p.id));
	const missing = allIds.filter((id) => !existingSet.has(id));

	if (missing.length === 0) return 0;

	// Insert from submission data (we already have name, rating, tags)
	const rows = missing.map((id) => {
		const p = problemMap.get(id)!;
		return {
			id: p.id,
			name: p.name,
			rating: p.rating,
			tags: p.tags,
		};
	});

	const { error } = await admin
		.from("cf_problems")
		.upsert(rows, { onConflict: "id" });

	if (error) {
		console.error("CF problems backfill error:", error.message);
		return 0;
	}

	return rows.length;
}
