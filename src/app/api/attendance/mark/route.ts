import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { RATE_LIMITS } from '@/lib/utils/constants';
import { checkRateLimit } from '@/lib/utils/ratelimit';

/**
 * POST /api/attendance/mark
 * Mark attendance. { course_id, date, slot, status: "attended"|"bunked" }
 */
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

		const rateCheck = await checkRateLimit(
			admin,
			user.id,
			'attendance_marks',
			RATE_LIMITS.ATTENDANCE_MARKS,
		);

		if (!rateCheck.allowed) {
			return NextResponse.json(
				{
					error: `Daily limit of ${RATE_LIMITS.ATTENDANCE_MARKS} marks reached`,
				},
				{ status: 429 },
			);
		}

		const { course_id, date, slot, status } = await request.json();

		if (!course_id || !date || slot === undefined || !status) {
			return NextResponse.json(
				{ error: 'course_id, date, slot, status required' },
				{ status: 400 },
			);
		}

		if (!['attended', 'bunked'].includes(status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
		}

		// Upsert: allows updating if already marked
		const { data: record, error } = await admin
			.from('attendance_records')
			.upsert(
				{
					user_id: user.id,
					course_id,
					date,
					slot,
					status,
				},
				{ onConflict: 'user_id,course_id,date,slot' },
			)
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			record,
			remaining: rateCheck.remaining - 1,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

/**
 * DELETE /api/attendance/mark
 * Clear a single attendance record. { course_id, date, slot }
 */
export async function DELETE(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { course_id, date, slot } = await request.json();

		if (!course_id || !date || slot === undefined) {
			return NextResponse.json({ error: 'course_id, date, slot required' }, { status: 400 });
		}

		const admin = createAdminClient();
		const { error } = await admin
			.from('attendance_records')
			.delete()
			.eq('user_id', user.id)
			.eq('course_id', course_id)
			.eq('date', date)
			.eq('slot', slot);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
