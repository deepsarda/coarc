import { NextResponse } from 'next/server';
import { computeAttendanceInsights } from '@/lib/attendance/calculator';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/attendance/calculator
 * Attendance insights: skip calculator, projections, risk levels.
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
		const insights = await computeAttendanceInsights(admin, user.id);

		return NextResponse.json({ insights });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
