import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/attendance/reset
 * Delete all attendance records for the current user.
 */
export async function DELETE() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const admin = createAdminClient();
		const { error } = await admin.from('attendance_records').delete().eq('user_id', user.id);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
