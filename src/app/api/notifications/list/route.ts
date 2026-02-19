import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications/list?page=1&unread_only=true
 * User's notifications (paginated).
 */
export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') ?? '1', 10);
		const unreadOnly = url.searchParams.get('unread_only') === 'true';
		const limit = 30;
		const offset = (page - 1) * limit;

		let query = supabase
			.from('notifications')
			.select('*', { count: 'exact' })
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (unreadOnly) {
			query = query.eq('read', false);
		}

		const { data: notifications, count } = await query;

		// Get unread count
		const { count: unreadCount } = await supabase
			.from('notifications')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.eq('read', false);

		return NextResponse.json({
			notifications: notifications ?? [],
			page,
			total: count ?? 0,
			unread_count: unreadCount ?? 0,
			has_more: (count ?? 0) > offset + limit,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
