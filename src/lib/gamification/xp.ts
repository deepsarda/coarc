import type { SupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications/send';
import { getLevelForXP } from '@/lib/utils/constants';

/**
 * Award XP to a user: logs the transaction, updates profile.xp,
 * recomputes level, and sends a level-up notification if applicable.
 */
export async function awardXP(
	admin: SupabaseClient,
	userId: string,
	amount: number,
	reason: string,
	referenceId?: string,
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
	// Insert XP log entry
	await admin.from('xp_log').insert({
		user_id: userId,
		amount,
		reason,
		reference_id: referenceId ?? null,
	});

	// Get current profile
	const { data: profile } = await admin
		.from('profiles')
		.select('xp, level')
		.eq('id', userId)
		.single();

	if (!profile) {
		return { newXP: amount, newLevel: 1, leveledUp: false };
	}

	const newXP = profile.xp + amount;
	const levelInfo = getLevelForXP(newXP);
	const leveledUp = levelInfo.level > profile.level;

	// Update profile XP + level
	await admin.from('profiles').update({ xp: newXP, level: levelInfo.level }).eq('id', userId);

	// Send level-up notification
	if (leveledUp) {
		await createNotification(
			admin,
			userId,
			'level_up',
			`🎉 Level Up!`,
			`You reached Level ${levelInfo.level}: ${levelInfo.title}!`,
			{ level: levelInfo.level, title: levelInfo.title, url: '/dashboard' },
		);
	}

	return { newXP, newLevel: levelInfo.level, leveledUp };
}
