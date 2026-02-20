import type { SupabaseClient } from '@supabase/supabase-js';
import { checkAndAwardBadges } from '@/lib/gamification/badges';
import { updateUserStreak } from '@/lib/gamification/streaks';
import { syncUserStats } from '@/lib/services/sync';

const BATCH_SIZE = 3; // Sync 3 users in parallel per batch
const BATCH_DELAY = 1500; // 1.5s between batches

/**
 * Sync Codeforces data for all users with cf_handle set.
 * After syncing, backfills any missing problems in cf_problems cache.
 */
export async function syncAllCf(admin: SupabaseClient) {
	const { data: users } = await admin
		.from('profiles')
		.select('id, cf_handle, lc_handle')
		.not('cf_handle', 'is', null);

	if (!users || users.length === 0) return { synced: 0 };

	// Shuffle users so rate-limits affect evenly across runs
	for (let i = users.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[users[i], users[j]] = [users[j], users[i]];
	}

	let synced = 0;
	const errors: string[] = [];

	// Process in batches of BATCH_SIZE
	for (let b = 0; b < users.length; b += BATCH_SIZE) {
		const batch = users.slice(b, b + BATCH_SIZE);

		const results = await Promise.allSettled(
			batch.map(async (user) => {
				try {
					const result = await syncUserStats(
						admin,
						user.id,
						user.cf_handle,
						null, // don't sync LC in this job
					);

					if (result.cf.success) {
						await updateUserStreak(admin, user.id);
						await checkAndAwardBadges(admin, user.id);
						return { success: true, handle: user.cf_handle };
					}
					return { success: false, handle: user.cf_handle, error: result.cf.error };
				} catch (err) {
					return {
						success: false,
						handle: user.cf_handle,
						error: err instanceof Error ? err.message : 'Unknown',
					};
				}
			}),
		);

		for (const r of results) {
			if (r.status === 'fulfilled') {
				if (r.value.success) synced++;
				else if (r.value.error) errors.push(`${r.value.handle}: ${r.value.error}`);
			}
		}

		// Delay between batches (skip after last batch)
		if (b + BATCH_SIZE < users.length) {
			await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
		}
	}

	// Backfill missing CF problems from submissions
	const backfilled = await backfillMissingCfProblems(admin);

	return {
		synced,
		total: users.length,
		batch_size: BATCH_SIZE,
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
		.from('cf_submissions')
		.select('problem_id, problem_name, problem_rating, tags')
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
		.from('cf_problems')
		.select('id')
		.in('id', allIds.slice(0, 1000));

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

	const { error } = await admin.from('cf_problems').upsert(rows, { onConflict: 'id' });

	if (error) {
		console.error('CF problems backfill error:', error.message);
		return 0;
	}

	return rows.length;
}
