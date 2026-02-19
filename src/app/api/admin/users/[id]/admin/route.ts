import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/users/[id]/admin
 * Toggle admin flag for a user (admin only).
 * Body: { is_admin: boolean }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: targetId } = await params;

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

		if (targetId === user.id) {
			return NextResponse.json({ error: 'Cannot modify your own admin status' }, { status: 400 });
		}

		const { is_admin } = await request.json();

		const { data: updated, error } = await admin
			.from('profiles')
			.update({ is_admin })
			.eq('id', targetId)
			.select('id, display_name, is_admin')
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true, user: updated });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
