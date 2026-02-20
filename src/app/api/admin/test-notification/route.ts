import { NextResponse } from 'next/server';
import { sendPush } from '@/lib/notifications/push';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/test-notification
 * Send a test push notification to a specific user or all users.
 * Body: { user_id?: string, title: string, body: string }
 */
export async function POST(request: Request) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Check admin
	const admin = createAdminClient();
	const { data: profile } = await admin
		.from('profiles')
		.select('is_admin')
		.eq('id', user.id)
		.single();

	if (!profile?.is_admin) {
		return NextResponse.json({ error: 'Admin only' }, { status: 403 });
	}

	const { user_id, title, body } = await request.json();

	if (!title || !body) {
		return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
	}

	// Get target users
	let query = admin
		.from('profiles')
		.select('id, display_name, push_subscription')
		.not('push_subscription', 'is', null);

	if (user_id) {
		query = query.eq('id', user_id);
	}

	const { data: targets } = await query;

	if (!targets || targets.length === 0) {
		return NextResponse.json({ error: 'No users with push subscriptions found' }, { status: 404 });
	}

	let sent = 0;
	const errors: string[] = [];

	for (const target of targets) {
		try {
			const result = await sendPush(target.push_subscription, {
				title,
				body,
				tag: 'admin-test',
				url: '/dashboard',
			});
			if (result) sent++;
		} catch (err) {
			errors.push(`${target.display_name}: ${err instanceof Error ? err.message : 'Unknown'}`);
		}
	}

	return NextResponse.json({ sent, total: targets.length, errors: errors.slice(0, 5) });
}
