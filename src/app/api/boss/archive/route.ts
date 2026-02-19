import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/boss/archive
 * Past boss battles with solve stats.
 */
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const now = new Date().toISOString();

		const { data: bosses } = await supabase
			.from("boss_battles")
			.select("*")
			.lt("ends_at", now)
			.order("ends_at", { ascending: false });

		if (!bosses) {
			return NextResponse.json({ bosses: [] });
		}

		// Get solve counts and user's solves
		const enriched = await Promise.all(
			bosses.map(async (boss) => {
				const { count } = await supabase
					.from("boss_battle_solves")
					.select("id", { count: "exact", head: true })
					.eq("boss_battle_id", boss.id);

				const { data: userSolve } = await supabase
					.from("boss_battle_solves")
					.select("solve_rank, solved_at")
					.eq("boss_battle_id", boss.id)
					.eq("user_id", user.id)
					.single();

				return {
					...boss,
					solves_count: count ?? 0,
					user_solved: !!userSolve,
					user_solve_rank: userSolve?.solve_rank ?? null,
				};
			}),
		);

		return NextResponse.json({ bosses: enriched });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
