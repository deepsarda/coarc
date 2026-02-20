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

		// Fetch course schedules from DB
		const courseIds = [...new Set(records.map((r: { course_id: number }) => r.course_id))];
		const { data: courses } = await admin
			.from('courses')
			.select('id, schedule')
			.in('id', courseIds);
		const scheduleMap = new Map<number, Record<string, number>>();
		for (const c of courses ?? []) {
			scheduleMap.set(c.id, c.schedule ?? { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 });
		}

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
			const schedule = scheduleMap.get(course_id) ?? { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 };

			// Spread classes across matching schedule days from startDate to today
			// Each entry is { date, slots } where slots = number of slots on that day
			const availableDays: { date: string; slots: number }[] = [];
			const cursor = new Date(startDate);
			while (cursor <= today) {
				const dow = String(cursor.getDay());
				const slotsForDay = schedule[dow];
				if (slotsForDay && slotsForDay > 0) {
					const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
					availableDays.push({ date: ds, slots: slotsForDay });
				}
				cursor.setDate(cursor.getDate() + 1);
			}

			if (availableDays.length === 0) continue;

			// Count total available slot-instances
			const totalSlotInstances = availableDays.reduce((sum, d) => sum + d.slots, 0);
			const classCount = Math.min(total, totalSlotInstances);

			// Distribute classes evenly across available slot-instances
			let placed = 0;
			for (const day of availableDays) {
				if (placed >= classCount) break;
				for (let s = 1; s <= day.slots && placed < classCount; s++) {
					const status = placed < actualAttended ? 'attended' : 'bunked';
					upsertRows.push({
						user_id: user.id,
						course_id,
						date: day.date,
						slot: s,
						status,
					});
					placed++;
				}
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
