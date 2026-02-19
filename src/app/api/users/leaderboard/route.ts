import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/leaderboard?board=xp|cf_rating|lc_solved|streak&period=weekly|monthly|all&page=1&limit=10
 * Multi-board leaderboard with pagination.
 */
export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const url = new URL(request.url);
		const board = url.searchParams.get('board') ?? 'cf_rating';
		const period = url.searchParams.get('period') ?? 'all';
		const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
		const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '10', 10)));

		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		// CF Rating Board
		if (board === 'cf_rating') {
			const { data: profiles } = await supabase
				.from('profiles')
				.select('id, display_name, roll_number, xp, level, current_streak, cf_handle, lc_handle');

			const profileList = profiles ?? [];

			// Fetch latest CF rating for each user with a cf_handle
			const cfUsers = profileList.filter((p) => p.cf_handle);
			const ratingMap = new Map<string, number>();

			if (cfUsers.length > 0) {
				const { data: ratings } = await supabase
					.from('cf_ratings')
					.select('user_id, new_rating, timestamp')
					.in(
						'user_id',
						cfUsers.map((u) => u.id),
					)
					.order('timestamp', { ascending: false });

				// Keep only the latest rating per user
				for (const r of ratings ?? []) {
					if (!ratingMap.has(r.user_id)) {
						ratingMap.set(r.user_id, r.new_rating);
					}
				}
			}

			const ranked = profileList
				.filter((p) => p.cf_handle && ratingMap.has(p.id))
				.map((p) => ({
					...p,
					cf_rating: ratingMap.get(p.id) ?? 0,
				}))
				.sort((a, b) => b.cf_rating - a.cf_rating)
				.map((p, i) => ({ rank: i + 1, ...p }));

			const total = ranked.length;
			const start = (page - 1) * limit;
			const pageData = ranked.slice(start, start + limit);

			// Find current user's rank
			const myEntry = ranked.find((e) => e.id === user.id) ?? null;

			return NextResponse.json({
				leaderboard: pageData,
				board,
				page,
				limit,
				total,
				my_entry: myEntry,
			});
		}

		// LC Solved Board
		if (board === 'lc_solved') {
			const { data: profiles } = await supabase
				.from('profiles')
				.select('id, display_name, roll_number, xp, level, current_streak, cf_handle, lc_handle');

			const profileList = profiles ?? [];
			const lcUsers = profileList.filter((p) => p.lc_handle);

			const lcMap = new Map<
				string,
				{ easy: number; medium: number; hard: number; total: number }
			>();

			if (lcUsers.length > 0) {
				const { data: lcStats } = await supabase
					.from('lc_stats')
					.select('user_id, easy_solved, medium_solved, hard_solved, total_solved')
					.in(
						'user_id',
						lcUsers.map((u) => u.id),
					);

				for (const s of lcStats ?? []) {
					lcMap.set(s.user_id, {
						easy: s.easy_solved,
						medium: s.medium_solved,
						hard: s.hard_solved,
						total: s.total_solved,
					});
				}
			}

			const ranked = profileList
				.filter((p) => p.lc_handle && lcMap.has(p.id))
				.map((p) => ({
					...p,
					lc_stats: lcMap.get(p.id)!,
				}))
				.sort((a, b) => b.lc_stats.total - a.lc_stats.total)
				.map((p, i) => ({ rank: i + 1, ...p }));

			const total = ranked.length;
			const start = (page - 1) * limit;
			const pageData = ranked.slice(start, start + limit);
			const myEntry = ranked.find((e) => e.id === user.id) ?? null;

			return NextResponse.json({
				leaderboard: pageData,
				board,
				page,
				limit,
				total,
				my_entry: myEntry,
			});
		}

		// Streak Board
		if (board === 'streak') {
			const { data: profiles } = await supabase
				.from('profiles')
				.select(
					'id, display_name, roll_number, xp, level, current_streak, longest_streak, cf_handle, lc_handle',
				)
				.order('current_streak', { ascending: false });

			const ranked = (profiles ?? [])
				.filter((p) => p.current_streak > 0 || p.longest_streak > 0)
				.sort((a, b) => {
					if (b.current_streak !== a.current_streak) return b.current_streak - a.current_streak;
					return b.longest_streak - a.longest_streak;
				})
				.map((p, i) => ({ rank: i + 1, ...p }));

			const total = ranked.length;
			const start = (page - 1) * limit;
			const pageData = ranked.slice(start, start + limit);
			const myEntry = ranked.find((e) => e.id === user.id) ?? null;

			return NextResponse.json({
				leaderboard: pageData,
				board,
				page,
				limit,
				total,
				my_entry: myEntry,
			});
		}

		// XP Board (default)
		if (period === 'all') {
			const { data: profiles } = await supabase
				.from('profiles')
				.select('id, display_name, roll_number, xp, level, current_streak, cf_handle, lc_handle')
				.order('xp', { ascending: false });

			const ranked = (profiles ?? []).map((p, i) => ({
				rank: i + 1,
				...p,
			}));

			const total = ranked.length;
			const start = (page - 1) * limit;
			const pageData = ranked.slice(start, start + limit);
			const myEntry = ranked.find((e) => e.id === user.id) ?? null;

			return NextResponse.json({
				leaderboard: pageData,
				board: 'xp',
				period,
				page,
				limit,
				total,
				my_entry: myEntry,
			});
		}

		// Weekly or monthly XP: compute from xp_log
		const now = new Date();
		let since: Date;

		if (period === 'weekly') {
			const dayOfWeek = now.getDay();
			since = new Date(now);
			since.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
			since.setHours(0, 0, 0, 0);
		} else {
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
			.select('id, display_name, roll_number, xp, level, current_streak, cf_handle, lc_handle');

		const ranked = (profiles ?? [])
			.map((p) => ({
				...p,
				period_xp: xpByUser.get(p.id) ?? 0,
			}))
			.sort((a, b) => b.period_xp - a.period_xp)
			.map((p, i) => ({
				rank: i + 1,
				...p,
			}));

		const total = ranked.length;
		const start = (page - 1) * limit;
		const pageData = ranked.slice(start, start + limit);
		const myEntry = ranked.find((e) => e.id === user.id) ?? null;

		return NextResponse.json({
			leaderboard: pageData,
			board: 'xp',
			period,
			page,
			limit,
			total,
			my_entry: myEntry,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
