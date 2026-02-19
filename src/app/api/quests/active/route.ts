import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/quests/active
 * Current week's quests + user progress.
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

		// Get current week start (Monday)
		const now = new Date();
		const dayOfWeek = now.getDay();
		const monday = new Date(now);
		monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
		monday.setHours(0, 0, 0, 0);
		const weekStartStr = monday.toISOString().split("T")[0];

		const { data: quests } = await supabase
			.from("quests")
			.select("*")
			.eq("week_start", weekStartStr)
			.order("id");

		if (!quests || quests.length === 0) {
			return NextResponse.json({ quests: [], week_start: weekStartStr });
		}

		// Get user's progress on these quests
		const questIds = quests.map((q) => q.id);
		const { data: userQuests } = await supabase
			.from("user_quests")
			.select("*")
			.eq("user_id", user.id)
			.in("quest_id", questIds);

		const progressMap = new Map(
			(userQuests ?? []).map((uq) => [uq.quest_id, uq]),
		);

		const enriched = quests.map((q) => ({
			...q,
			user_progress: progressMap.get(q.id) ?? {
				progress: 0,
				completed: false,
				completed_at: null,
			},
		}));

		// Check if all quests completed
		const allCompleted = enriched.every((q) => q.user_progress.completed);

		return NextResponse.json({
			quests: enriched,
			week_start: weekStartStr,
			all_completed: allCompleted,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
