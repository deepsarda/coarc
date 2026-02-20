import type { SupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications/send';
import { XP_REWARDS } from '@/lib/utils/constants';
import { daysAgoIST, todayIST, yesterdayIST } from '@/lib/utils/ist';
import { checkAndAwardBadges } from './badges';
import { awardXP } from './xp';

/**
 * Process streaks for ALL users. Called daily at midnight IST.
 * - Continues streak if last_solve_date is yesterday
 * - Uses shields if available
 * - Resets streak if no shield
 * - Awards streak XP
 * - Sends "streak at risk" warnings
 */
export async function processAllStreaks(admin: SupabaseClient) {
	const todayStr = todayIST();

	const { data: profiles } = await admin
		.from('profiles')
		.select(
			'id, current_streak, longest_streak, streak_shields, last_solve_date, last_streak_processed',
		);

	if (!profiles) return;

	const yesterdayStr = yesterdayIST();
	const dayBeforeStr = daysAgoIST(2);

	for (const profile of profiles) {
		// Skip if already processed today (prevents duplicate runs)
		if (profile.last_streak_processed === todayStr) continue;

		if (!profile.last_solve_date) {
			// Mark as processed even if no solve history
			await admin.from('profiles').update({ last_streak_processed: todayStr }).eq('id', profile.id);
			continue;
		}

		const lastSolve = profile.last_solve_date;

		if (lastSolve === yesterdayStr) {
			// Streak continues, award daily streak XP
			const streakDay = Math.min(profile.current_streak, 10);
			const xpAmount = Math.min(
				XP_REWARDS.STREAK_PER_DAY_BASE * streakDay,
				XP_REWARDS.STREAK_PER_DAY_CAP,
			);

			if (xpAmount > 0) {
				await awardXP(
					admin,
					profile.id,
					xpAmount,
					`Streak bonus (day ${profile.current_streak})`,
					`streak_day_${profile.current_streak}`,
				);
			}

			// Check for shield milestone: 1 shield per 7-day streak
			if (profile.current_streak > 0 && profile.current_streak % 7 === 0) {
				await admin
					.from('profiles')
					.update({ streak_shields: profile.streak_shields + 1 })
					.eq('id', profile.id);
			}
		} else if (lastSolve < yesterdayStr && lastSolve <= dayBeforeStr) {
			// Missed yesterday
			if (profile.streak_shields > 0) {
				// Use a shield
				await admin
					.from('profiles')
					.update({
						streak_shields: profile.streak_shields - 1,
					})
					.eq('id', profile.id);

				await createNotification(
					admin,
					profile.id,
					'streak_warning',
					'🛡️ Streak Shield Used!',
					`Your ${profile.current_streak}-day streak was saved by a shield! ${profile.streak_shields - 1} shields remaining.`,
					{ url: '/dashboard' },
				);
			} else if (profile.current_streak > 0) {
				// Reset streak
				const lostStreak = profile.current_streak;
				await admin.from('profiles').update({ current_streak: 0 }).eq('id', profile.id);

				await createNotification(
					admin,
					profile.id,
					'streak_lost',
					'💔 Streak Lost',
					`Your ${lostStreak}-day streak has ended. Start fresh today!`,
					{ url: '/dashboard', lost_streak: lostStreak },
				);
			}
		}

		// Mark this user as processed for today
		await admin.from('profiles').update({ last_streak_processed: todayStr }).eq('id', profile.id);

		// Run badge checks for streak-related badges
		await checkAndAwardBadges(admin, profile.id);
	}
}

/**
 * Send "streak at risk" warnings. Called at 6 PM IST for users
 * who haven't solved today and have streak >= 2.
 */
export async function sendStreakWarnings(admin: SupabaseClient) {
	const todayStr = todayIST();

	const { data: atRiskUsers } = await admin
		.from('profiles')
		.select('id, current_streak, last_solve_date')
		.gte('current_streak', 2);

	if (!atRiskUsers) return;

	const warnings = atRiskUsers
		.filter((user) => user.last_solve_date !== todayStr)
		.map((user) =>
			createNotification(
				admin,
				user.id,
				'streak_warning',
				'🔥 Streak at Risk!',
				`Your ${user.current_streak}-day streak expires at midnight! Solve a problem now.`,
				{ url: '/problems/daily' },
			).catch(() => {}),
		);

	await Promise.allSettled(warnings);
}

/**
 * Update a single user's streak after a new solve is detected.
 */
export async function updateUserStreak(admin: SupabaseClient, userId: string) {
	const todayStr = todayIST();

	const { data: profile } = await admin
		.from('profiles')
		.select('current_streak, longest_streak, last_solve_date')
		.eq('id', userId)
		.single();

	if (!profile) return;

	// Already solved today
	if (profile.last_solve_date === todayStr) return;

	const yesterdayStr = yesterdayIST();

	let newStreak: number;

	if (profile.last_solve_date === yesterdayStr || profile.last_solve_date === todayStr) {
		// Continue streak
		newStreak = profile.current_streak + 1;
	} else {
		// Start new streak
		newStreak = 1;
	}

	const newLongest = Math.max(newStreak, profile.longest_streak);

	await admin
		.from('profiles')
		.update({
			current_streak: newStreak,
			longest_streak: newLongest,
			last_solve_date: todayStr,
		})
		.eq('id', userId);
}
