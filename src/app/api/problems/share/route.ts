import { NextResponse } from 'next/server';
import { awardXP } from '@/lib/gamification/xp';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { RATE_LIMITS, XP_REWARDS } from '@/lib/utils/constants';
import { checkRateLimit } from '@/lib/utils/ratelimit';

/**
 * POST /api/problems/share
 * Share a problem. Rate-limited to 3/day.
 */
export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const admin = createAdminClient();

		// Rate limit check
		const rateCheck = await checkRateLimit(
			admin,
			user.id,
			'share_problem',
			RATE_LIMITS.SHARE_PROBLEM,
		);

		if (!rateCheck.allowed) {
			return NextResponse.json(
				{
					error: `Daily limit reached (${RATE_LIMITS.SHARE_PROBLEM}/day)`,
					remaining: 0,
				},
				{ status: 429 },
			);
		}

		const { platform, problem_url, problem_title, problem_id, difficulty, tags, note } =
			await request.json();

		if (!platform || !problem_url || !problem_title) {
			return NextResponse.json(
				{ error: 'platform, problem_url, and problem_title are required' },
				{ status: 400 },
			);
		}

		const { data: problem, error } = await admin
			.from('shared_problems')
			.insert({
				user_id: user.id,
				platform,
				problem_url,
				problem_title,
				problem_id: problem_id ?? null,
				difficulty: difficulty ?? null,
				tags: tags ?? [],
				note: note ?? null,
				source: 'manual',
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Award XP for sharing
		await awardXP(
			admin,
			user.id,
			XP_REWARDS.SHARE_PROBLEM,
			'Shared a problem',
			`share_${problem.id}`,
		);

		return NextResponse.json({
			success: true,
			problem,
			xp_earned: XP_REWARDS.SHARE_PROBLEM,
			remaining: rateCheck.remaining - 1,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
