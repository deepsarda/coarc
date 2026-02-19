import type { SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications/send";
import { XP_REWARDS } from "@/lib/utils/constants";
import { awardXP } from "./xp";

interface BadgeRow {
	id: string;
	name: string;
	condition_type: string;
	condition_value: Record<string, unknown> | null;
}

/**
 * Check all auto-award badges against a user's current stats.
 * Awards any newly qualified badges + XP + notification.
 * Returns list of newly awarded badge IDs.
 */
export async function checkAndAwardBadges(
	admin: SupabaseClient,
	userId: string,
): Promise<string[]> {
	// Get all auto badges
	const { data: allBadges } = await admin
		.from("badges")
		.select("id, name, condition_type, condition_value")
		.eq("condition_type", "auto");

	if (!allBadges || allBadges.length === 0) return [];

	// Get user's existing badges
	const { data: existingBadges } = await admin
		.from("user_badges")
		.select("badge_id")
		.eq("user_id", userId);

	const earnedSet = new Set((existingBadges ?? []).map((b) => b.badge_id));

	// Get user stats for condition checking
	const stats = await getUserStats(admin, userId);

	// Check each unearned badge
	const awarded: string[] = [];

	for (const badge of allBadges as BadgeRow[]) {
		if (earnedSet.has(badge.id)) continue;
		if (!badge.condition_value) continue;

		const met = evaluateCondition(badge.condition_value, stats);
		if (!met) continue;

		// Award the badge
		const { error } = await admin.from("user_badges").insert({
			user_id: userId,
			badge_id: badge.id,
		});

		if (error) continue; // Already awarded (race condition) or other error

		awarded.push(badge.id);

		// Award badge XP
		await awardXP(
			admin,
			userId,
			XP_REWARDS.BADGE_EARNED,
			`Badge earned: ${badge.name}`,
			`badge_${badge.id}`,
		);

		// Send notification
		await createNotification(
			admin,
			userId,
			"badge_earned",
			`🏅 Badge Unlocked!`,
			`You earned the "${badge.name}" badge!`,
			{ badge_id: badge.id, url: "/profile/me" },
		);
	}

	return awarded;
}

// Stats object used by badge condition evaluator
interface UserStats {
	totalSolves: number;
	cfSolves: number;
	lcSolves: number;
	currentStreak: number;
	longestStreak: number;
	problemsShared: number;
	duelsWon: number;
	bossesDefeated: number;
	bossFirstSolves: number;
	resourcesApproved: number;
	allQuestsWeeks: number;
	uniqueTopics: number;
	dailySolves: number;
	solveHours: number[]; // hours of recent solves (0-23)
	rankClimb: number;
	lastLostStreak: number;
}

async function getUserStats(
	admin: SupabaseClient,
	userId: string,
): Promise<UserStats> {
	const [
		cfSubsResult,
		lcStatsResult,
		profileResult,
		sharedResult,
		duelsResult,
		bossResult,
		bossFirstResult,
		resourcesResult,
		allQuestsResult,
		dailySolvesResult,
	] = await Promise.all([
		admin
			.from("cf_submissions")
			.select("id, tags, submitted_at", { count: "exact" })
			.eq("user_id", userId)
			.eq("verdict", "OK"),
		admin
			.from("lc_stats")
			.select("total_solved")
			.eq("user_id", userId)
			.single(),
		admin
			.from("profiles")
			.select("current_streak, longest_streak")
			.eq("id", userId)
			.single(),
		admin
			.from("shared_problems")
			.select("id", { count: "exact" })
			.eq("user_id", userId)
			.eq("source", "manual"),
		admin
			.from("duels")
			.select("id", { count: "exact" })
			.eq("winner_id", userId),
		admin
			.from("boss_battle_solves")
			.select("id", { count: "exact" })
			.eq("user_id", userId),
		admin
			.from("boss_battle_solves")
			.select("id", { count: "exact" })
			.eq("user_id", userId)
			.eq("solve_rank", 1),
		admin
			.from("resources")
			.select("id", { count: "exact" })
			.eq("submitted_by", userId)
			.eq("status", "approved"),
		admin
			.from("user_quests")
			.select("quest_id")
			.eq("user_id", userId)
			.eq("completed", true),
		admin
			.from("daily_problem_solves")
			.select("id", { count: "exact" })
			.eq("user_id", userId),
	]);

	// Count unique topics from CF submissions
	const cfSubs = cfSubsResult.data ?? [];
	const uniqueTopicsSet = new Set<string>();
	const solveHours: number[] = [];
	for (const sub of cfSubs) {
		if (sub.tags) {
			for (const tag of sub.tags as string[]) {
				uniqueTopicsSet.add(tag);
			}
		}
		if (sub.submitted_at) {
			solveHours.push(new Date(sub.submitted_at).getHours());
		}
	}

	// Count "all quests completed in a week": group by quest week
	const completedQuests = allQuestsResult.data ?? [];
	let allQuestsWeeks = 0;
	if (completedQuests.length > 0) {
		// Get quest week_start for each completed quest
		const questIds = completedQuests.map((q) => q.quest_id);
		const { data: questWeeks } = await admin
			.from("quests")
			.select("id, week_start")
			.in("id", questIds);

		if (questWeeks) {
			const weekCounts = new Map<string, number>();
			const weekTotals = new Map<string, number>();

			for (const q of questWeeks) {
				weekCounts.set(q.week_start, (weekCounts.get(q.week_start) ?? 0) + 1);
			}

			// Get total quests per week
			const weeks = [...weekCounts.keys()];
			for (const w of weeks) {
				const { count } = await admin
					.from("quests")
					.select("id", { count: "exact", head: true })
					.eq("week_start", w);
				weekTotals.set(w, count ?? 0);
			}

			for (const [week, completed] of weekCounts) {
				const total = weekTotals.get(week) ?? 0;
				if (total > 0 && completed >= total) {
					allQuestsWeeks++;
				}
			}
		}
	}

	const cfSolveCount = cfSubsResult.count ?? 0;
	const lcSolveCount = lcStatsResult.data?.total_solved ?? 0;

	return {
		totalSolves: cfSolveCount + lcSolveCount,
		cfSolves: cfSolveCount,
		lcSolves: lcSolveCount,
		currentStreak: profileResult.data?.current_streak ?? 0,
		longestStreak: profileResult.data?.longest_streak ?? 0,
		problemsShared: sharedResult.count ?? 0,
		duelsWon: duelsResult.count ?? 0,
		bossesDefeated: bossResult.count ?? 0,
		bossFirstSolves: bossFirstResult.count ?? 0,
		resourcesApproved: resourcesResult.count ?? 0,
		allQuestsWeeks,
		uniqueTopics: uniqueTopicsSet.size,
		dailySolves: dailySolvesResult.count ?? 0,
		solveHours,
		rankClimb: 0, // Computed separately by compute-rankings cron
		lastLostStreak: 0, // Tracked separately
	};
}

function evaluateCondition(
	condition: Record<string, unknown>,
	stats: UserStats,
): boolean {
	const type = condition.type as string;

	switch (type) {
		case "total_solves":
			return stats.totalSolves >= (condition.count as number);
		case "streak":
			return stats.currentStreak >= (condition.days as number);
		case "problems_shared":
			return stats.problemsShared >= (condition.count as number);
		case "duels_won":
			return stats.duelsWon >= (condition.count as number);
		case "bosses_defeated":
			return stats.bossesDefeated >= (condition.count as number);
		case "boss_first_solves":
			return stats.bossFirstSolves >= (condition.count as number);
		case "resources_approved":
			return stats.resourcesApproved >= (condition.count as number);
		case "all_quests_week":
			return stats.allQuestsWeeks >= (condition.count as number);
		case "unique_topics":
			return stats.uniqueTopics >= (condition.count as number);
		case "daily_solves":
			return stats.dailySolves >= (condition.count as number);
		case "rank_climb":
			return stats.rankClimb >= (condition.positions as number);
		case "solve_hour_range": {
			const start = condition.start as number;
			const end = condition.end as number;
			return stats.solveHours.some((h) => h >= start && h < end);
		}
		case "streak_restart_after":
			return stats.lastLostStreak >= (condition.min_lost as number);
		default:
			return false;
	}
}
