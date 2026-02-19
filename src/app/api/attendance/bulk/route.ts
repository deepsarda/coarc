import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/attendance/bulk
 * Bulk-set attendance records for a user.
 * Body: { records: [{ course_id, attended, total }] }
 * Spreads records across past dates starting from a given date.
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

		const { records, start_date } = await request.json();

		if (!Array.isArray(records) || records.length === 0) {
			return NextResponse.json({ error: 'records array required' }, { status: 400 });
		}

		const admin = createAdminClient();

		// Calculate the date range for spreading records
		let startDate: Date;
		if (start_date) {
			// Parse as local date (avoid UTC timezone shift)
			const [sy, sm, sd] = start_date.split('-').map(Number);
			startDate = new Date(sy, sm - 1, sd);
		} else {
			startDate = new Date();
			startDate.setDate(startDate.getDate() - 90);
		}
		const today = new Date();
		today.setHours(23, 59, 59, 999); // Include all of today

		// Build all records to upsert
		const upsertRows: {
			user_id: string;
			course_id: number;
			date: string;
			slot: number;
			status: 'attended' | 'bunked';
		}[] = [];

		for (const rec of records) {
			const { course_id, attended, total } = rec;
			if (!course_id || total <= 0) continue;

			const actualAttended = Math.min(attended, total);

			// Spread classes evenly across available weekdays from startDate to today
			const availableDays: string[] = [];
			const cursor = new Date(startDate);
			while (cursor <= today) {
				const dow = cursor.getDay();
				// Skip Sundays (0)
				if (dow !== 0) {
					const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
					availableDays.push(ds);
				}
				cursor.setDate(cursor.getDate() + 1);
			}

			if (availableDays.length === 0) continue;

			// Evenly distribute 'total' classes across available days using proportional indices
			const n = availableDays.length;
			const classCount = Math.min(total, n); // Can't place more than available days
			for (let i = 0; i < classCount; i++) {
				// Pick evenly-spaced indices: 0, n/total, 2n/total, ...
				const dayIdx = Math.round((i * (n - 1)) / (classCount - 1 || 1));
				const status = i < actualAttended ? 'attended' : 'bunked';
				upsertRows.push({
					user_id: user.id,
					course_id,
					date: availableDays[dayIdx],
					slot: 1,
					status,
				});
			}
		}

		if (upsertRows.length === 0) {
			return NextResponse.json({ error: 'No valid records to create' }, { status: 400 });
		}

		// Upsert all at once (Supabase supports bulk upsert)
		const BATCH_SIZE = 500;
		let totalInserted = 0;
		for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
			const batch = upsertRows.slice(i, i + BATCH_SIZE);
			const { error } = await admin
				.from('attendance_records')
				.upsert(batch, { onConflict: 'user_id,course_id,date,slot' });
			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 });
			}
			totalInserted += batch.length;
		}

		return NextResponse.json({ success: true, records_created: totalInserted });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
