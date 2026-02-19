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
