import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/resources/list?topic=X
 * Approved resources, optionally filtered by topic.
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
		const topic = url.searchParams.get('topic');

		let query = supabase
			.from('resources')
			.select('*, profiles:submitted_by(display_name)')
			.eq('status', 'approved')
			.order('created_at', { ascending: false });

		if (topic) {
			query = query.eq('topic', topic);
		}

		const { data: resources, error } = await query;

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Get unique topics
		const { data: allResources } = await supabase
			.from('resources')
			.select('topic')
			.eq('status', 'approved');

		const topics = [...new Set((allResources ?? []).map((r) => r.topic))].sort();

		return NextResponse.json({ resources: resources ?? [], topics });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
