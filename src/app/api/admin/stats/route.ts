import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/stats
 * Platform-wide statistics (admin only).
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

		const admin = createAdminClient();
		const { data: profile } = await admin
			.from("profiles")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (!profile?.is_admin) {
			return NextResponse.json({ error: "Admin only" }, { status: 403 });
		}

		const [
			usersResult,
			cfSolvesResult,
			activeStreaksResult,
			duelsResult,
			sharedProblemsResult,
			resourcesResult,
			bossesResult,
		] = await Promise.all([
			admin.from("profiles").select("id", { count: "exact", head: true }),
			admin
				.from("cf_submissions")
				.select("id", { count: "exact", head: true })
				.eq("verdict", "OK"),
			admin
				.from("profiles")
				.select("id", { count: "exact", head: true })
				.gte("current_streak", 1),
			admin.from("duels").select("id", { count: "exact", head: true }),
			admin
				.from("shared_problems")
				.select("id", { count: "exact", head: true }),
			admin
				.from("resources")
				.select("id", { count: "exact", head: true })
				.eq("status", "approved"),
			admin.from("boss_battles").select("id", { count: "exact", head: true }),
		]);

		// Total XP awarded
		const { data: totalXP } = await admin.from("xp_log").select("amount");
		const totalXPAwarded = (totalXP ?? []).reduce(
			(sum, log) => sum + log.amount,
			0,
		);

		// Average level
		const { data: levels } = await admin.from("profiles").select("level");
		const avgLevel =
			levels && levels.length > 0
				? Math.round(
						(levels.reduce((sum, p) => sum + p.level, 0) / levels.length) * 10,
					) / 10
				: 0;

		return NextResponse.json({
			stats: {
				total_users: usersResult.count ?? 0,
				total_cf_solves: cfSolvesResult.count ?? 0,
				active_streaks: activeStreaksResult.count ?? 0,
				total_duels: duelsResult.count ?? 0,
				shared_problems: sharedProblemsResult.count ?? 0,
				approved_resources: resourcesResult.count ?? 0,
				boss_battles: bossesResult.count ?? 0,
				total_xp_awarded: totalXPAwarded,
				average_level: avgLevel,
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
