import { NextResponse } from "next/server";
import { awardXP } from "@/lib/gamification/xp";
import { createNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS } from "@/lib/utils/constants";

/**
 * POST /api/quests/[id]/progress
 * Update quest progress. { progress: number }
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const questId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const admin = createAdminClient();
		const { progress } = await request.json();

		// Get the quest
		const { data: quest } = await admin
			.from("quests")
			.select("*")
			.eq("id", questId)
			.single();

		if (!quest) {
			return NextResponse.json({ error: "Quest not found" }, { status: 404 });
		}

		// Get or create user_quest
		const { data: userQuest } = await admin
			.from("user_quests")
			.select("*")
			.eq("user_id", user.id)
			.eq("quest_id", questId)
			.single();

		if (userQuest?.completed) {
			return NextResponse.json(
				{ error: "Quest already completed" },
				{ status: 409 },
			);
		}

		const condition = quest.condition as Record<string, unknown>;
		const requiredCount = (condition.count as number) ?? 1;
		const newProgress = progress ?? (userQuest?.progress ?? 0) + 1;
		const completed = newProgress >= requiredCount;

		if (userQuest) {
			await admin
				.from("user_quests")
				.update({
					progress: newProgress,
					completed,
					completed_at: completed ? new Date().toISOString() : null,
				})
				.eq("id", userQuest.id);
		} else {
			await admin.from("user_quests").insert({
				user_id: user.id,
				quest_id: questId,
				progress: newProgress,
				completed,
				completed_at: completed ? new Date().toISOString() : null,
			});
		}

		if (completed) {
			// Award XP
			await awardXP(
				admin,
				user.id,
				quest.xp_reward,
				`Quest completed: ${quest.title}`,
				`quest_${questId}`,
			);

			// Notify
			await createNotification(
				admin,
				user.id,
				"quest_complete",
				"✅ Quest Complete!",
				`"${quest.title}" completed! +${quest.xp_reward} XP`,
				{ quest_id: questId, url: "/quests" },
			);

			// Check if ALL quests this week are completed → bonus
			const weekStart = quest.week_start;
			const { data: weekQuests } = await admin
				.from("quests")
				.select("id")
				.eq("week_start", weekStart);

			const { data: userCompleted } = await admin
				.from("user_quests")
				.select("quest_id")
				.eq("user_id", user.id)
				.eq("completed", true)
				.in(
					"quest_id",
					(weekQuests ?? []).map((q) => q.id),
				);

			if (
				weekQuests &&
				userCompleted &&
				userCompleted.length >= weekQuests.length
			) {
				await awardXP(
					admin,
					user.id,
					XP_REWARDS.QUEST_ALL_BONUS,
					"All weekly quests completed!",
					`quest_all_${weekStart}`,
				);
			}
		}

		return NextResponse.json({
			success: true,
			progress: newProgress,
			completed,
			xp_earned: completed ? quest.xp_reward : 0,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
