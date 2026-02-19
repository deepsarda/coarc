import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/gamification/badges
 * All badges + which ones the current user has earned.
 */
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const [allBadges, userBadges] = await Promise.all([
			supabase.from('badges').select('*').order('category'),
			supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', user.id),
		]);

		const earnedMap = new Map((userBadges.data ?? []).map((ub) => [ub.badge_id, ub.earned_at]));

		const badges = (allBadges.data ?? []).map((badge) => ({
			...badge,
			earned: earnedMap.has(badge.id),
			earned_at: earnedMap.get(badge.id) ?? null,
		}));

		return NextResponse.json({
			badges,
			earned_count: earnedMap.size,
			total_count: allBadges.data?.length ?? 0,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
