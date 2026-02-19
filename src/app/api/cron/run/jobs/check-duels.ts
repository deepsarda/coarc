import type { SupabaseClient } from '@supabase/supabase-js';
import { awardXP } from '@/lib/gamification/xp';
import { createNotification } from '@/lib/notifications/send';
import { fetchCfSubmissions } from '@/lib/services/codeforces';
import { XP_REWARDS } from '@/lib/utils/constants';

/**
 * Check and resolve duels:
 * - Expire pending duels older than 24h
 * - Check active duels for solves
 * - Resolve timed-out active duels
 */
export async function runCheckDuels(admin: SupabaseClient) {
	const now = new Date();
	let expired = 0;
	let resolved = 0;

	// Expire pending duels older than 24h
	const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const { data: pendingDuels } = await admin
		.from('duels')
		.select('id')
		.eq('status', 'pending')
		.lt('created_at', twentyFourHoursAgo.toISOString());

	if (pendingDuels && pendingDuels.length > 0) {
		await admin
			.from('duels')
			.update({ status: 'expired' })
			.in(
				'id',
				pendingDuels.map((d) => d.id),
			);
		expired = pendingDuels.length;
	}

	// Check active duels
	const { data: activeDuels } = await admin
		.from('duels')
		.select(
			'id, challenger_id, challenged_id, problem_id, time_limit_minutes, started_at, expires_at',
		)
		.eq('status', 'active');

	for (const duel of activeDuels ?? []) {
		if (!duel.started_at || !duel.problem_id) continue;

		const expiresAt = duel.expires_at
			? new Date(duel.expires_at)
			: new Date(new Date(duel.started_at).getTime() + duel.time_limit_minutes * 60 * 1000);

		// Get challenger and challenged CF handles
		const { data: participants } = await admin
			.from('profiles')
			.select('id, cf_handle')
			.in('id', [duel.challenger_id, duel.challenged_id]);

		if (!participants || participants.length < 2) continue;

		const challengerHandle = participants.find((p) => p.id === duel.challenger_id)?.cf_handle;
		const challengedHandle = participants.find((p) => p.id === duel.challenged_id)?.cf_handle;

		if (!challengerHandle || !challengedHandle) continue;

		// Check if either has solved the problem
		let challengerSolveTime: number | null = null;
		let challengedSolveTime: number | null = null;

		try {
			const challengerSubs = await fetchCfSubmissions(challengerHandle, 50);
			const challengedSubs = await fetchCfSubmissions(challengedHandle, 50);

			const startTime = new Date(duel.started_at).getTime();

			for (const sub of challengerSubs) {
				if (
					sub.problemId === duel.problem_id &&
					sub.verdict === 'OK' &&
					sub.submittedAt.getTime() >= startTime
				) {
					challengerSolveTime = Math.round((sub.submittedAt.getTime() - startTime) / 1000);
					break;
				}
			}

			for (const sub of challengedSubs) {
				if (
					sub.problemId === duel.problem_id &&
					sub.verdict === 'OK' &&
					sub.submittedAt.getTime() >= startTime
				) {
					challengedSolveTime = Math.round((sub.submittedAt.getTime() - startTime) / 1000);
					break;
				}
			}
		} catch {
			// API error, skip this duel
			continue;
		}

		const isExpired = now >= expiresAt;
		const bothSolved = challengerSolveTime !== null && challengedSolveTime !== null;
		const anySolved = challengerSolveTime !== null || challengedSolveTime !== null;

		if (bothSolved || isExpired) {
			// Resolve the duel
			let winnerId: string | null = null;

			if (challengerSolveTime !== null && challengedSolveTime !== null) {
				winnerId =
					challengerSolveTime <= challengedSolveTime ? duel.challenger_id : duel.challenged_id;
			} else if (challengerSolveTime !== null) {
				winnerId = duel.challenger_id;
			} else if (challengedSolveTime !== null) {
				winnerId = duel.challenged_id;
			}
			// If neither solved → draw (winner_id = null)

			await admin
				.from('duels')
				.update({
					status: 'completed',
					winner_id: winnerId,
					challenger_solve_time: challengerSolveTime,
					challenged_solve_time: challengedSolveTime,
				})
				.eq('id', duel.id);

			// Award XP
			if (winnerId) {
				const loserId = winnerId === duel.challenger_id ? duel.challenged_id : duel.challenger_id;
				await awardXP(admin, winnerId, XP_REWARDS.DUEL_WIN, 'Duel won', `duel_${duel.id}`);
				await awardXP(
					admin,
					loserId,
					XP_REWARDS.DUEL_LOSS,
					'Duel participation',
					`duel_${duel.id}`,
				);

				// Notify both
				const { data: winnerProfile } = await admin
					.from('profiles')
					.select('display_name')
					.eq('id', winnerId)
					.single();

				await createNotification(
					admin,
					winnerId,
					'duel_result',
					'⚔️ Duel Won!',
					`You won the duel! +${XP_REWARDS.DUEL_WIN} XP`,
					{ duel_id: duel.id, url: '/duels' },
				);
				await createNotification(
					admin,
					loserId,
					'duel_result',
					'⚔️ Duel Result',
					`${winnerProfile?.display_name ?? 'Opponent'} won the duel. +${XP_REWARDS.DUEL_LOSS} XP for participating!`,
					{ duel_id: duel.id, url: '/duels' },
				);
			} else if (anySolved === false && isExpired) {
				// Draw, no one solved
				await awardXP(
					admin,
					duel.challenger_id,
					XP_REWARDS.DUEL_LOSS,
					'Duel draw',
					`duel_${duel.id}`,
				);
				await awardXP(
					admin,
					duel.challenged_id,
					XP_REWARDS.DUEL_LOSS,
					'Duel draw',
					`duel_${duel.id}`,
				);
			}

			resolved++;
		}

		// Rate-limit API calls
		await new Promise((r) => setTimeout(r, 1000));
	}

	return { expired, resolved };
}
