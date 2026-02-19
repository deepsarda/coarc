import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/leaderboard?period=weekly|monthly|all
 * Leaderboard rankings.
 */
export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const url = new URL(request.url);
		const period = url.searchParams.get('period') ?? 'all';

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		if (period === 'all') {
			// All-time: sort by total XP
			const { data: profiles } = await supabase
				.from('profiles')
				.select('id, display_name, xp, level, current_streak, cf_handle, lc_handle')
				.order('xp', { ascending: false });

			const leaderboard = (profiles ?? []).map((p, i) => ({
				rank: i + 1,
				...p,
			}));

			return NextResponse.json({ leaderboard, period });
		}

		// Weekly or monthly: compute from xp_log
		const now = new Date();
		let since: Date;

		if (period === 'weekly') {
			const dayOfWeek = now.getDay();
			since = new Date(now);
			since.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
			since.setHours(0, 0, 0, 0);
		} else {
			// monthly
			since = new Date(now.getFullYear(), now.getMonth(), 1);
		}

		const { data: xpLogs } = await supabase
			.from('xp_log')
			.select('user_id, amount')
			.gte('created_at', since.toISOString());

		const xpByUser = new Map<string, number>();
		for (const log of xpLogs ?? []) {
			xpByUser.set(log.user_id, (xpByUser.get(log.user_id) ?? 0) + log.amount);
		}

		const { data: profiles } = await supabase
			.from('profiles')
			.select('id, display_name, xp, level, current_streak, cf_handle, lc_handle');

		const leaderboard = (profiles ?? [])
			.map((p) => ({
				...p,
				period_xp: xpByUser.get(p.id) ?? 0,
			}))
			.sort((a, b) => b.period_xp - a.period_xp)
			.map((p, i) => ({
				rank: i + 1,
				...p,
			}));

		return NextResponse.json({ leaderboard, period });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
