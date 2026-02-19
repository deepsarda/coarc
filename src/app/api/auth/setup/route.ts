import { NextResponse } from 'next/server';
import { ROLL } from '@/lib/config';
import { verifyLcHandle } from '@/lib/services/leetcode';
import { syncUserStats } from '@/lib/services/sync';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { XP_REWARDS } from '@/lib/utils/constants';
import { extractCfHandle, extractLcHandle } from '@/lib/utils/handles';

const GENESIS_BADGE_ID = 'genesis';
const GENESIS_BADGE_LIMIT = 20;
const INITIAL_JOIN_XP = 50; // Welcome bonus XP

export async function POST(request: Request) {
	try {
		// Verify the user is authenticated
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Parse request body
		const { displayName, cfHandle, lcHandle } = await request.json();

		if (!displayName?.trim()) {
			return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
		}

		// Determine roll number from email
		const rollNumber = user.email ? ROLL.fromEmail(user.email) : null;
		if (!rollNumber) {
			return NextResponse.json(
				{ error: 'Could not determine roll number from email' },
				{ status: 400 },
			);
		}

		// Use the admin client for all writes (bypasses RLS for xp_log, user_badges)
		const admin = createAdminClient();

		// Check if profile already exists
		const { data: existing } = await admin.from('profiles').select('id').eq('id', user.id).single();

		if (existing) {
			return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
		}

		// Extract handles from URLs or plain text, then verify server-side
		const trimmedCf = extractCfHandle(cfHandle?.trim() || '');
		const trimmedLc = extractLcHandle(lcHandle?.trim() || '');

		const [cfResult, lcResult] = await Promise.all([
			trimmedCf ? verifyCfHandle(trimmedCf) : Promise.resolve(null),
			trimmedLc ? verifyLcHandle(trimmedLc) : Promise.resolve(null),
		]);

		if (cfResult === false) {
			return NextResponse.json(
				{ error: 'Codeforces handle not found', field: 'cf' },
				{ status: 400 },
			);
		}

		if (lcResult === false) {
			return NextResponse.json(
				{ error: 'LeetCode username not found', field: 'lc' },
				{ status: 400 },
			);
		}

		// Create the profile with initial XP
		const { data: profile, error: profileError } = await admin
			.from('profiles')
			.insert({
				id: user.id,
				roll_number: rollNumber,
				display_name: displayName.trim(),
				cf_handle: trimmedCf,
				lc_handle: trimmedLc,
				xp: INITIAL_JOIN_XP,
			})
			.select()
			.single();

		if (profileError) {
			console.error('Profile creation error:', profileError);
			return NextResponse.json({ error: profileError.message }, { status: 500 });
		}

		// Log the welcome XP
		await admin.from('xp_log').insert({
			user_id: user.id,
			amount: INITIAL_JOIN_XP,
			reason: 'Welcome bonus, joined CO.ARC',
			reference_id: `join_${user.id}`,
		});

		// Check if user qualifies for Genesis badge (first N users)
		const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true });

		const xpAwarded: { amount: number; reason: string }[] = [
			{ amount: INITIAL_JOIN_XP, reason: 'Welcome bonus' },
		];

		const badgesEarned: string[] = [];

		if (count !== null && count <= GENESIS_BADGE_LIMIT) {
			// Award the Genesis badge
			const { error: badgeError } = await admin.from('user_badges').insert({
				user_id: user.id,
				badge_id: GENESIS_BADGE_ID,
			});

			if (!badgeError) {
				badgesEarned.push(GENESIS_BADGE_ID);

				// Award bonus XP for earning a badge
				const badgeXP = XP_REWARDS.BADGE_EARNED;
				await admin.from('xp_log').insert({
					user_id: user.id,
					amount: badgeXP,
					reason: `Badge earned: Genesis`,
					reference_id: `badge_${GENESIS_BADGE_ID}`,
				});

				// Update profile XP to include badge bonus
				await admin
					.from('profiles')
					.update({ xp: INITIAL_JOIN_XP + badgeXP })
					.eq('id', user.id);

				xpAwarded.push({ amount: badgeXP, reason: 'Genesis badge bonus' });
			}
		}

		// Trigger initial stats sync (fire-and-forget, don't block the response)
		const syncPromise = syncUserStats(admin, user.id, trimmedCf, trimmedLc).catch((err) => {
			console.error('Initial sync failed (non-blocking):', err);
			return null;
		});

		// Wait up to 5s for sync to finish, then respond anyway
		const syncResult = await Promise.race([
			syncPromise,
			new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
		]);

		return NextResponse.json({
			success: true,
			profile,
			rewards: {
				xp: xpAwarded,
				badges: badgesEarned,
				totalXP: xpAwarded.reduce((sum, x) => sum + x.amount, 0),
			},
			sync: syncResult,
		});
	} catch (err) {
		console.error('Setup error:', err);
		return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
	}
}

// Handle Verification Helpers

async function verifyCfHandle(handle: string): Promise<boolean> {
	try {
		const res = await fetch(
			`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
			{ signal: AbortSignal.timeout(8000) },
		);
		const data = await res.json();
		return data.status === 'OK';
	} catch {
		// If the API is down, block signup with error
		console.error(`CF verification failed for "${handle}", api is likely down`);
		return false;
	}
}
