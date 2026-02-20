import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/boss/active
 * Get the currently active boss battle with HP bar data.
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

		const now = new Date().toISOString();

		const { data: boss } = await supabase
			.from('boss_battles')
			.select('*')
			.lte('starts_at', now)
			.gte('ends_at', now)
			.order('starts_at', { ascending: false })
			.limit(1)
			.single();

		if (!boss) {
			// No active boss — check for upcoming battles
			const { data: upcoming } = await supabase
				.from('boss_battles')
				.select('id, title, difficulty_label, starts_at, ends_at, problem_url')
				.gt('starts_at', now)
				.order('starts_at', { ascending: true })
				.limit(5);

			return NextResponse.json({
				boss: null,
				upcoming: upcoming ?? [],
				message: 'No active boss battle',
			});
		}

		// Get solves with user info
		const { data: solves, count: solvesCount } = await supabase
			.from('boss_battle_solves')
			.select('*, profiles:user_id(display_name)', { count: 'exact' })
			.eq('boss_id', boss.id)
			.order('solved_at', { ascending: true });

		// Check if current user solved
		const userSolve = (solves ?? []).find((s) => s.user_id === user.id);

		// Get total CF profiles
		const { count: cfUserCount } = await supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.not('cf_handle', 'is', null);

		// HP bar: total HP = ceil(CF profiles / 2)
		const totalHP = Math.max(1, Math.ceil((cfUserCount ?? 0) / 2));
		const currentHP = Math.max(0, totalHP - (solvesCount ?? 0));

		return NextResponse.json({
			boss: {
				...boss,
				total_hp: totalHP,
				current_hp: currentHP,
				solves_count: solvesCount ?? 0,
				solves: (solves ?? []).slice(0, 10), // Top 10 solvers
			},
			user_solved: !!userSolve,
			user_solve_rank: userSolve?.solve_rank ?? null,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
