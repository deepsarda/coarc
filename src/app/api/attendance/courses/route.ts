import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/attendance/courses
 * List all active courses.
 *
 * POST /api/attendance/courses
 * Create a new course (admin only). { name, code?, color }
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

		const { data: courses } = await supabase
			.from('courses')
			.select('*')
			.eq('is_active', true)
			.order('name');

		return NextResponse.json({ courses: courses ?? [] });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

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

		const { name, code, color, classes_per_week, semester_end } = await request.json();
		if (!name || !color) {
			return NextResponse.json({ error: 'name and color required' }, { status: 400 });
		}

		const { data: course, error } = await admin
			.from('courses')
			.insert({
				name,
				code: code ?? null,
				color,
				classes_per_week: classes_per_week ?? 3,
				semester_end: semester_end ?? null,
				created_by: user.id,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true, course });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
