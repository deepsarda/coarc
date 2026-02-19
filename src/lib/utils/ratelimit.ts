import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if a user has exceeded their daily rate limit for an action.
 * Uses the relevant table's created_at timestamp.
 */
export async function checkRateLimit(
	admin: SupabaseClient,
	userId: string,
	action:
		| 'share_problem'
		| 'send_duel'
		| 'resource_submission'
		| 'attendance_marks'
		| 'problem_reactions',
	limit: number,
): Promise<{ allowed: boolean; remaining: number; used: number }> {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	let count = 0;

	switch (action) {
		case 'share_problem': {
			const { count: c } = await admin
				.from('shared_problems')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', userId)
				.eq('source', 'manual')
				.gte('created_at', todayStart.toISOString());
			count = c ?? 0;
			break;
		}
		case 'send_duel': {
			const { count: c } = await admin
				.from('duels')
				.select('id', { count: 'exact', head: true })
				.eq('challenger_id', userId)
				.gte('created_at', todayStart.toISOString());
			count = c ?? 0;
			break;
		}
		case 'resource_submission': {
			const { count: c } = await admin
				.from('resources')
				.select('id', { count: 'exact', head: true })
				.eq('submitted_by', userId)
				.gte('created_at', todayStart.toISOString());
			count = c ?? 0;
			break;
		}
		case 'attendance_marks': {
			const { count: c } = await admin
				.from('attendance_records')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', userId)
				.gte('created_at', todayStart.toISOString());
			count = c ?? 0;
			break;
		}
		case 'problem_reactions': {
			const { count: c } = await admin
				.from('problem_reactions')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', userId)
				.gte('created_at', todayStart.toISOString());
			count = c ?? 0;
			break;
		}
	}

	return {
		allowed: count < limit,
		remaining: Math.max(0, limit - count),
		used: count,
	};
}
