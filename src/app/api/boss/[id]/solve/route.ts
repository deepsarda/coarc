import { NextResponse } from "next/server";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { awardXP } from "@/lib/gamification/xp";
import { createNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/boss/[id]/solve
 * Record that the user solved the boss battle problem.
 */
export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const bossId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const admin = createAdminClient();

		// Get boss
		const { data: boss } = await admin
			.from("boss_battles")
			.select("*")
			.eq("id", bossId)
			.single();

		if (!boss) {
			return NextResponse.json({ error: "Boss not found" }, { status: 404 });
		}

		// Check timing
		const now = new Date();
		if (now < new Date(boss.starts_at) || now > new Date(boss.ends_at)) {
			return NextResponse.json(
				{ error: "Boss battle not active" },
				{ status: 400 },
			);
		}

		// Check already solved
		const { data: existing } = await admin
			.from("boss_battle_solves")
			.select("id")
			.eq("boss_battle_id", bossId)
			.eq("user_id", user.id)
			.single();

		if (existing) {
			return NextResponse.json({ error: "Already solved" }, { status: 409 });
		}

		// Get current solve count to determine rank
		const { count: solveCount } = await admin
			.from("boss_battle_solves")
			.select("id", { count: "exact", head: true })
			.eq("boss_battle_id", bossId);

		const solveRank = (solveCount ?? 0) + 1;

		// Insert solve
		await admin.from("boss_battle_solves").insert({
			boss_battle_id: bossId,
			user_id: user.id,
			solve_rank: solveRank,
		});

		// Determine XP based on rank
		let xpAmount: number;
		if (solveRank === 1) {
			xpAmount = boss.xp_first;
		} else if (solveRank <= 5) {
			xpAmount = boss.xp_top5;
		} else {
			xpAmount = boss.xp_others;
		}

		await awardXP(
			admin,
			user.id,
			xpAmount,
			`Boss Battle: ${boss.title} (Rank #${solveRank})`,
			`boss_${bossId}`,
		);

		// Check badges
		await checkAndAwardBadges(admin, user.id);

		// Notify about solve
		await createNotification(
			admin,
			user.id,
			"boss_solved",
			"💀 Boss Defeated!",
			`You solved "${boss.title}" (Rank #${solveRank}) and earned ${xpAmount} XP!`,
			{ boss_id: bossId, rank: solveRank, url: "/boss" },
		);

		return NextResponse.json({
			success: true,
			solve_rank: solveRank,
			xp_earned: xpAmount,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
