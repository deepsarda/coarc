import type { SupabaseClient } from "@supabase/supabase-js";
import { createNotification, notifyAllUsers } from "@/lib/notifications/send";

/**
 * Recompute leaderboard rankings, detect dark horses and overtakes.
 */
export async function runComputeRankings(admin: SupabaseClient) {
	// Get current week start
	const now = new Date();
	const dayOfWeek = now.getDay();
	const monday = new Date(now);
	monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
	monday.setHours(0, 0, 0, 0);
	const weekStartStr = monday.toISOString();

	// Compute weekly XP for all users
	const { data: xpLogs } = await admin
		.from("xp_log")
		.select("user_id, amount")
		.gte("created_at", weekStartStr);

	const weeklyXP = new Map<string, number>();
	for (const log of xpLogs ?? []) {
		weeklyXP.set(log.user_id, (weeklyXP.get(log.user_id) ?? 0) + log.amount);
	}

	// Get all profiles
	const { data: profiles } = await admin
		.from("profiles")
		.select("id, display_name, xp");

	if (!profiles) return { success: false };

	// Current weekly ranking
	const currentRanking = profiles
		.map((p) => ({
			user_id: p.id,
			display_name: p.display_name,
			weekly_xp: weeklyXP.get(p.id) ?? 0,
			total_xp: p.xp,
		}))
		.sort((a, b) => b.weekly_xp - a.weekly_xp)
		.map((p, i) => ({ ...p, rank: i + 1 }));

	// Get previous ranking snapshot (we store this in announcements data or compute from previous xp_log)
	// For simplicity, we'll skip the overtake detection on first run
	// and just detect dark horses based on XP movement

	// Dark Horse detection: users who earned significantly more XP than average this week
	const totalWeeklyXP = [...weeklyXP.values()].reduce((a, b) => a + b, 0);
	const avgWeeklyXP = weeklyXP.size > 0 ? totalWeeklyXP / weeklyXP.size : 0;

	const darkHorses: string[] = [];

	for (const entry of currentRanking) {
		// Dark horse: earned 3x the average this week and is in top 20
		if (
			entry.weekly_xp > avgWeeklyXP * 3 &&
			entry.weekly_xp > 50 &&
			entry.rank <= 20
		) {
			darkHorses.push(entry.user_id);

			// Notify all users about the dark horse
			await notifyAllUsers(
				admin,
				"dark_horse",
				"🐴 Dark Horse Alert!",
				`${entry.display_name} surged to #${entry.rank} this week with ${entry.weekly_xp} XP!`,
				{ user_id: entry.user_id, url: "/leaderboard" },
			);
		}
	}

	// Overtake detection (simplified): compare current weekly rank position
	// In a production setup, you'd store the previous ranking and diff
	// For now, we'll store the current snapshot for next time
	const { data: previousSnapshot } = await admin
		.from("weekly_digests")
		.select("content")
		.order("created_at", { ascending: false })
		.limit(1)
		.single();

	const previousRanking = (previousSnapshot?.content as Record<string, unknown>)
		?.ranking as { user_id: string; rank: number }[] | undefined;

	if (previousRanking) {
		const prevRankMap = new Map(
			previousRanking.map((p) => [p.user_id, p.rank]),
		);

		for (const entry of currentRanking) {
			const prevRank = prevRankMap.get(entry.user_id);
			if (prevRank && prevRank > entry.rank) {
				// This user moved up, check who they overtook
				const overtaken = currentRanking.filter((other) => {
					const otherPrev = prevRankMap.get(other.user_id);
					return (
						otherPrev &&
						otherPrev < prevRank &&
						other.rank > entry.rank &&
						other.user_id !== entry.user_id
					);
				});

				for (const victim of overtaken) {
					await createNotification(
						admin,
						victim.user_id,
						"overtake",
						"📈 You've Been Overtaken!",
						`${entry.display_name} just passed you on the leaderboard. You're now #${victim.rank}.`,
						{ url: "/leaderboard" },
					);
				}
			}
		}
	}

	return {
		success: true,
		dark_horses: darkHorses.length,
		total_users: currentRanking.length,
	};
}
