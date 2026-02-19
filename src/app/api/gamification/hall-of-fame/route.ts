import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/gamification/hall-of-fame
 * All hall of fame entries with user profiles.
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

		const { data: entries } = await supabase
			.from('hall_of_fame')
			.select('*, profiles:user_id(id, display_name, cf_handle, lc_handle)')
			.order('achieved_at', { ascending: false });

		return NextResponse.json({ entries: entries ?? [] });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
