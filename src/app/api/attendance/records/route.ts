import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/attendance/records?course_id=X&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Get attendance records for the current user.
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
		const courseId = url.searchParams.get('course_id');
		const from = url.searchParams.get('from');
		const to = url.searchParams.get('to');

		let query = supabase
			.from('attendance_records')
			.select('*, courses:course_id(id, name, code, color)')
			.eq('user_id', user.id)
			.order('date', { ascending: false });

		if (courseId) {
			query = query.eq('course_id', parseInt(courseId, 10));
		}
		if (from) {
			query = query.gte('date', from);
		}
		if (to) {
			query = query.lte('date', to);
		}

		const { data: records, error } = await query;

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ records: records ?? [] });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
