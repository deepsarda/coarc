import { NextResponse } from 'next/server';
import { notifyAllUsers } from '@/lib/notifications/send';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/boss/create
 * Create a new boss battle (admin only).
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

		// Check admin
		const { data: profile } = await admin
			.from('profiles')
			.select('is_admin')
			.eq('id', user.id)
			.single();

		if (!profile?.is_admin) {
			return NextResponse.json({ error: 'Admin only' }, { status: 403 });
		}

		const {
			title,
			description,
			problem_url,
			problem_id,
			difficulty_label,
			xp_first,
			xp_top5,
			xp_others,
			starts_at,
			ends_at,
		} = await request.json();

		if (!title || !problem_url || !starts_at || !ends_at) {
			return NextResponse.json(
				{ error: 'title, problem_url, starts_at, ends_at required' },
				{ status: 400 },
			);
		}

		if (!problem_url.includes('codeforces.com/')) {
			return NextResponse.json(
				{ error: 'problem_url must be a valid Codeforces link' },
				{ status: 400 },
			);
		}

		// Verify the problem actually exists via CF API
		const urlMatch =
			problem_url.match(/problemset\/problem\/(\d+)\/([^/?\s]+)/) ||
			problem_url.match(/contest\/(\d+)\/problem\/([^/?\s]+)/);

		if (!urlMatch) {
			return NextResponse.json(
				{ error: 'Could not parse contest ID and problem index from the URL' },
				{ status: 400 },
			);
		}

		const cfContestId = urlMatch[1];
		const cfIndex = urlMatch[2];

		try {
			const cfRes = await fetch(
				`https://codeforces.com/api/contest.standings?contestId=${cfContestId}&from=1&count=1&showUnofficial=false`,
			);
			const cfData = await cfRes.json();

			if (cfData.status !== 'OK') {
				return NextResponse.json(
					{ error: `Codeforces contest ${cfContestId} not found` },
					{ status: 400 },
				);
			}

			// Verify the problem index exists in the contest
			const problems = cfData.result?.problems ?? [];
			const problemExists = problems.some((p: { index: string }) => p.index === cfIndex);

			if (!problemExists) {
				return NextResponse.json(
					{ error: `Problem ${cfIndex} not found in Codeforces contest ${cfContestId}` },
					{ status: 400 },
				);
			}
		} catch (_) {
			return NextResponse.json(
				{ error: 'Failed to verify problem on Codeforces. Check the URL and try again.' },
				{ status: 400 },
			);
		}

		const { data: boss, error } = await admin
			.from('boss_battles')
			.insert({
				title,
				description: description ?? null,
				problem_url,
				problem_id: problem_id ?? null,
				difficulty_label: difficulty_label ?? null,
				xp_first: xp_first ?? 500,
				xp_top5: xp_top5 ?? 300,
				xp_others: xp_others ?? 150,
				starts_at,
				ends_at,
				created_by: user.id,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Notify all users
		await notifyAllUsers(
			admin,
			'boss_new',
			'👹 New Boss Battle!',
			`${title} -- ${difficulty_label ?? 'Challenge'} difficulty. Can you defeat it?`,
			{ boss_id: boss.id, url: '/boss' },
		);

		return NextResponse.json({ success: true, boss });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
