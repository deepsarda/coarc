import type { SupabaseClient } from '@supabase/supabase-js';
import { checkAndAwardBadges } from '@/lib/gamification/badges';
import { updateUserStreak } from '@/lib/gamification/streaks';
import { syncUserStats } from '@/lib/services/sync';

const BATCH_SIZE = 3; // Sync 3 users in parallel per batch
const BATCH_DELAY = 2000; // 2s between batches (LC is stricter)

/**
 * Sync LeetCode data for all users with lc_handle set.
 * After syncing, backfills any missing problems in lc_problems cache.
 */
export async function syncAllLc(admin: SupabaseClient) {
	const { data: users } = await admin
		.from('profiles')
		.select('id, cf_handle, lc_handle')
		.not('lc_handle', 'is', null);

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
						null, // don't sync CF in this job
						user.lc_handle,
					);

					if (result.lc.success) {
						await updateUserStreak(admin, user.id);
						await checkAndAwardBadges(admin, user.id);
						return { success: true, handle: user.lc_handle };
					}
					return { success: false, handle: user.lc_handle, error: result.lc.error };
				} catch (err) {
					return {
						success: false,
						handle: user.lc_handle,
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

	// Backfill missing LC problems from submissions
	const backfilled = await backfillMissingLcProblems(admin);

	return {
		synced,
		total: users.length,
		batch_size: BATCH_SIZE,
		backfilled,
		errors: errors.slice(0, 10),
	};
}

/**
 * Find LC problem slugs in lc_submissions that aren't in lc_problems yet,
 * and fetch their metadata from LeetCode GraphQL.
 */
async function backfillMissingLcProblems(admin: SupabaseClient) {
	// Get distinct slugs from submissions
	const { data: submissionSlugs } = await admin
		.from('lc_submissions')
		.select('problem_slug')
		.limit(1000);

	if (!submissionSlugs || submissionSlugs.length === 0) return 0;

	const allSlugs = [...new Set(submissionSlugs.map((s) => s.problem_slug))];

	// Check which ones are already cached
	const { data: existingProblems } = await admin
		.from('lc_problems')
		.select('slug')
		.in('slug', allSlugs);

	const existingSet = new Set((existingProblems ?? []).map((p) => p.slug));
	const missingSlugs = allSlugs.filter((s) => !existingSet.has(s));

	if (missingSlugs.length === 0) return 0;

	// Fetch metadata for missing problems (batch via GraphQL)
	let fetched = 0;

	for (const slug of missingSlugs.slice(0, 50)) {
		try {
			const query = `
				query questionData($titleSlug: String!) {
					question(titleSlug: $titleSlug) {
						titleSlug
						title
						difficulty
						topicTags { name }
						likes
					}
				}
			`;

			const res = await fetch('https://leetcode.com/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Referer: 'https://leetcode.com',
					Origin: 'https://leetcode.com',
				},
				body: JSON.stringify({
					query,
					variables: { titleSlug: slug },
				}),
			});

			if (!res.ok) continue;

			const data = await res.json();
			const q = data.data?.question;
			if (!q) continue;

			await admin.from('lc_problems').upsert(
				{
					slug: q.titleSlug,
					title: q.title,
					difficulty: q.difficulty,
					topics: q.topicTags.map((t: { name: string }) => t.name),
					likes: q.likes ?? null,
					url: `https://leetcode.com/problems/${q.titleSlug}/`,
				},
				{ onConflict: 'slug' },
			);

			fetched++;
			// Small delay
			await new Promise((r) => setTimeout(r, 300));
		} catch {
			// Skip individual failures
		}
	}

	return fetched;
}
