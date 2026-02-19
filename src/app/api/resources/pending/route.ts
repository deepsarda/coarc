import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/resources/pending
 * Pending resources (admin only).
 */
export async function GET() {
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

		const { data: resources } = await admin
			.from('resources')
			.select('*, profiles:submitted_by(display_name)')
			.eq('status', 'pending')
			.order('created_at', { ascending: true });

		return NextResponse.json({ resources: resources ?? [] });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
