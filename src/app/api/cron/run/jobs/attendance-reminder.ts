import type { SupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications/send';

/**
 * Attendance Reminder cron job.
 * Sends push notifications to users who opted in to attendance_reminder.
 * Should run ~6pm IST. Uses a 30-min window to avoid duplicate sends.
 */
export async function runAttendanceReminder(admin: SupabaseClient) {
	// Check if current time is within the 6pm IST window (17:45 - 18:15 IST)
	const now = new Date();
	const istOffset = 5.5 * 60; // IST is UTC+5:30
	const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
	const istMinutes = utcMinutes + istOffset;
	const normalizedIst = istMinutes >= 1440 ? istMinutes - 1440 : istMinutes;

	// 17:45 = 1065 min, 18:15 = 1095 min
	if (normalizedIst < 1065 || normalizedIst > 1095) {
		return { skipped: true, reason: 'Outside 6pm IST window', ist_minutes: normalizedIst };
	}

	// Check if we already sent today (use cron_runs dedup)
	const todayStr = now.toISOString().split('T')[0];
	const { data: lastRun } = await admin
		.from('cron_runs')
		.select('last_run_at')
		.eq('job_name', 'attendance-reminder')
		.single();

	if (lastRun) {
		const lastDate = new Date(lastRun.last_run_at).toISOString().split('T')[0];
		if (lastDate === todayStr) {
			return { skipped: true, reason: 'Already sent today' };
		}
	}

	// Get users who opted in
	const { data: users } = await admin
		.from('profiles')
		.select('id, push_subscription')
		.eq('attendance_reminder', true);

	if (!users || users.length === 0) {
		return { sent: 0, reason: 'No opted-in users' };
	}

	const results = await Promise.allSettled(
		users.map((user) =>
			createNotification(
				admin,
				user.id,
				'attendance_reminder',
				'📋 Attendance Reminder',
				"Don't forget to mark your attendance for today!",
				{ url: '/attendance' },
				!!user.push_subscription,
			),
		),
	);
	const sent = results.filter((r) => r.status === 'fulfilled').length;

	// Record the run
	await admin.from('cron_runs').upsert(
		{
			job_name: 'attendance-reminder',
			last_run_at: new Date().toISOString(),
			result: { sent } as Record<string, unknown>,
		},
		{ onConflict: 'job_name' },
	);

	return { sent, total_opted_in: users.length };
}
