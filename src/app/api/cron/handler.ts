import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const CRON_SECRET = process.env.CRON_SECRET;

// Jobs that should only run once per interval (hours)
const JOB_INTERVALS: Record<string, number> = {
	'generate-daily': 23,
	'generate-quests': 23,
	'weekly-digest': 144,
	'compute-rankings': 23,
};

/**
 * Check if a job should run based on minimum interval.
 */
async function shouldRunJob(admin: SupabaseClient, jobName: string): Promise<boolean> {
	const minInterval = JOB_INTERVALS[jobName];
	if (!minInterval) return true; // No interval guard

	const { data } = await admin
		.from('cron_runs')
		.select('last_run_at')
		.eq('job_name', jobName)
		.single();

	if (!data) return true;

	const lastRun = new Date(data.last_run_at);
	const elapsed = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
	return elapsed >= minInterval;
}

/**
 * Record that a job ran successfully.
 */
async function recordJobRun(admin: SupabaseClient, jobName: string, result: unknown) {
	if (JOB_INTERVALS[jobName]) {
		await admin.from('cron_runs').upsert(
			{
				job_name: jobName,
				last_run_at: new Date().toISOString(),
				result: result as Record<string, unknown>,
			},
			{ onConflict: 'job_name' },
		);
	}
}

/**
 * Create a GET handler for an individual cron job.
 * Respects interval-based dedup so calling 10 times/day still only runs once for guarded jobs.
 */
export function createCronHandler(
	jobName: string,
	runFn: (admin: SupabaseClient) => Promise<unknown>,
) {
	return async function GET(request: Request) {
		const url = new URL(request.url);
		const secret = url.searchParams.get('secret');
		if (CRON_SECRET && secret !== CRON_SECRET) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const admin = createAdminClient();

		// Check interval-based dedup
		const canRun = await shouldRunJob(admin, jobName);
		if (!canRun) {
			return NextResponse.json({
				job: jobName,
				skipped: true,
				reason: 'Too soon since last run',
			});
		}

		try {
			const start = Date.now();
			const result = await runFn(admin);
			const duration = Date.now() - start;

			await recordJobRun(admin, jobName, result);

			return NextResponse.json({
				job: jobName,
				success: true,
				duration_ms: duration,
				result,
			});
		} catch (err) {
			return NextResponse.json(
				{
					job: jobName,
					success: false,
					error: err instanceof Error ? err.message : 'Unknown error',
				},
				{ status: 500 },
			);
		}
	};
}
