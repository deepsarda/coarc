import type { SupabaseClient } from '@supabase/supabase-js';
import { notifyAllUsers } from '@/lib/notifications/send';

/**
 * Compile the weekly digest and publish as an announcement.
 * Run Sunday 8 PM IST.
 */
export async function runWeeklyDigest(admin: SupabaseClient) {
	const now = new Date();
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - 7);
	weekStart.setHours(0, 0, 0, 0);
	const weekStartStr = weekStart.toISOString();
	const weekStartDate = weekStart.toISOString().split('T')[0];

	// Check if digest already exists for this week
	const { data: existing } = await admin
		.from('weekly_digests')
		.select('id')
		.eq('week_start', weekStartDate)
		.single();

	if (existing) return { skipped: true, reason: 'Already generated' };

	// Compile stats

	// Class-wide solves this week
	const { count: totalCfSolves } = await admin
		.from('cf_submissions')
		.select('id', { count: 'exact', head: true })
		.eq('verdict', 'OK')
		.gte('submitted_at', weekStartStr);

	// Top 3 XP earners this week
	const { data: topEarners } = await admin
		.from('xp_log')
		.select('user_id, amount')
		.gte('created_at', weekStartStr);

	const xpByUser = new Map<string, number>();
	for (const log of topEarners ?? []) {
		xpByUser.set(log.user_id, (xpByUser.get(log.user_id) ?? 0) + log.amount);
	}

	const topThree = [...xpByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

	// Get display names for top 3
	const topUserIds = topThree.map((t) => t[0]);
	const { data: topProfiles } = await admin
		.from('profiles')
		.select('id, display_name')
		.in('id', topUserIds);

	const topRanked = topThree.map(([uid, xp], i) => ({
		rank: i + 1,
		name: topProfiles?.find((p) => p.id === uid)?.display_name ?? 'Unknown',
		xp,
	}));

	// Most reacted problem
	const { data: topProblem } = await admin
		.from('shared_problems')
		.select('id, problem_title, user_id')
		.gte('created_at', weekStartStr)
		.limit(1);

	// Active streaks
	const { count: activeStreaks } = await admin
		.from('profiles')
		.select('id', { count: 'exact', head: true })
		.gte('current_streak', 1);

	const digestContent = {
		week: weekStartDate,
		class_solves: totalCfSolves ?? 0,
		top_three: topRanked,
		featured_problem: topProblem?.[0] ?? null,
		active_streaks: activeStreaks ?? 0,
		generated_at: now.toISOString(),
	};

	// Insert digest
	await admin.from('weekly_digests').insert({
		week_start: weekStartDate,
		content: digestContent,
	});

	// Create announcement
	const body = [
		`📊 **Weekly Digest ${weekStartDate}**\n`,
		`🏆 **Top 3 of the Week:**`,
		...topRanked.map((t) => `  ${t.rank}. ${t.name} - ${t.xp} XP`),
		`\n💻 Class solved **${totalCfSolves ?? 0}** problems this week!`,
		`🔥 **${activeStreaks ?? 0}** active streaks`,
	].join('\n');

	await admin.from('announcements').insert({
		title: `Weekly Digest ${weekStartDate}`,
		body,
		priority: 'normal',
	});

	// Notify all users
	await notifyAllUsers(
		admin,
		'weekly_digest',
		'📊 Your Weekly Digest is Here!',
		`Check out this week's highlights and stats.`,
		{ url: '/announcements' },
	);

	return { success: true };
}
