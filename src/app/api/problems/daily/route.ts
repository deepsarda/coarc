import { NextResponse } from 'next/server';
import { updateUserStreak } from '@/lib/gamification/streaks';
import { awardXP } from '@/lib/gamification/xp';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { XP_REWARDS } from '@/lib/utils/constants';

/**
 * GET /api/problems/daily
 * Get today's daily problem + solve status + solve count.
 *
 * POST /api/problems/daily
 * Record that the user solved today's daily problem.
 */
export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const url = new URL(request.url);
		const date = url.searchParams.get('date') ?? new Date().toISOString().split('T')[0];

		const { data: daily } = await supabase
			.from('daily_problems')
			.select('*')
			.eq('date', date)
			.single();

		if (!daily) {
			return NextResponse.json({ error: 'No daily problem set', daily: null });
		}

		// Get solve count
		const { count: solvesCount } = await supabase
			.from('daily_problem_solves')
			.select('id', { count: 'exact', head: true })
			.eq('daily_problem_id', daily.id);

		// Check if user solved
		const { data: userSolve } = await supabase
			.from('daily_problem_solves')
			.select('id, solved_at')
			.eq('daily_problem_id', daily.id)
			.eq('user_id', user.id)
			.single();

		return NextResponse.json({
			daily,
			solves_count: solvesCount ?? 0,
			user_solved: !!userSolve,
			user_solve_time: userSolve?.solved_at ?? null,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(_request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const todayStr = new Date().toISOString().split('T')[0];
		const admin = createAdminClient();

		// Get today's daily
		const { data: daily } = await admin
			.from('daily_problems')
			.select('id')
			.eq('date', todayStr)
			.single();

		if (!daily) {
			return NextResponse.json({ error: 'No daily problem today' }, { status: 404 });
		}

		// Check if already solved
		const { data: existing } = await admin
			.from('daily_problem_solves')
			.select('id')
			.eq('daily_problem_id', daily.id)
			.eq('user_id', user.id)
			.single();

		if (existing) {
			return NextResponse.json({ error: 'Already solved' }, { status: 409 });
		}

		// Record solve
		await admin.from('daily_problem_solves').insert({
			daily_problem_id: daily.id,
			user_id: user.id,
		});

		// Award XP
		await awardXP(
			admin,
			user.id,
			XP_REWARDS.SOLVE_DAILY,
			'Daily problem solved',
			`daily_${daily.id}`,
		);

		// Update streak
		await updateUserStreak(admin, user.id);

		return NextResponse.json({
			success: true,
			xp_earned: XP_REWARDS.SOLVE_DAILY,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
