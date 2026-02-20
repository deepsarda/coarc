import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/quests/active
 * Create a new quest (admin only).
 * Body: { title, description, quest_type, condition, xp_reward, week_start }
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
		const { data: profile } = await admin
			.from('profiles')
			.select('is_admin')
			.eq('id', user.id)
			.single();

		if (!profile?.is_admin) {
			return NextResponse.json({ error: 'Admin only' }, { status: 403 });
		}

		const { title, description, quest_type, condition, xp_reward, week_start } =
			await request.json();

		if (!title || !description || !quest_type || !condition || !xp_reward || !week_start) {
			return NextResponse.json(
				{
					error:
						'All fields required: title, description, quest_type, condition, xp_reward, week_start',
				},
				{ status: 400 },
			);
		}

		const { data: quest, error } = await admin
			.from('quests')
			.insert({
				title,
				description,
				quest_type,
				condition,
				xp_reward,
				week_start,
				is_admin_curated: true,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true, quest });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
