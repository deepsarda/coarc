import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/[id]
 * Get any user's public profile including stats and badges.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const supabase = await createClient();

		// Get profile
		const { data: profile, error } = await supabase
			.from('profiles')
			.select(
				'id, roll_number, display_name, cf_handle, lc_handle, xp, level, current_streak, longest_streak, created_at',
			)
			.eq('id', id)
			.single();

		if (error || !profile) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Get badges, CF stats, LC stats concurrently
		const [badgesResult, cfRatingResult, lcStatsResult] = await Promise.all([
			supabase
				.from('user_badges')
				.select('badge_id, earned_at, badges:badge_id(id, name, description, icon, category)')
				.eq('user_id', id),
			supabase
				.from('cf_ratings')
				.select('new_rating, contest_name, timestamp')
				.eq('user_id', id)
				.order('timestamp', { ascending: false })
				.limit(1),
			supabase.from('lc_stats').select('*').eq('user_id', id).single(),
		]);

		return NextResponse.json({
			profile,
			badges: badgesResult.data ?? [],
			cf_rating: cfRatingResult.data?.[0] ?? null,
			lc_stats: lcStatsResult.data ?? null,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
