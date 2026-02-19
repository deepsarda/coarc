import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runCheckDuels } from './jobs/check-duels';
import { runComputeRankings } from './jobs/compute-rankings';
import { runGenerateDaily } from './jobs/generate-daily';
import { runGenerateQuests } from './jobs/generate-quests';
import { syncAllCf } from './jobs/sync-cf';
import { syncAllLc } from './jobs/sync-lc';
import { runUpdateStreaks } from './jobs/update-streaks';
import { runWeeklyDigest } from './jobs/weekly-digest';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Check if a job should run based on minimum interval.
 * Returns true if enough time has passed since the last successful run.
 */
async function shouldRunJob(
	admin: SupabaseClient,
	jobName: string,
	minIntervalHours: number,
): Promise<boolean> {
	const { data } = await admin
		.from('cron_runs')
		.select('last_run_at')
		.eq('job_name', jobName)
		.single();

	if (!data) return true;

	const lastRun = new Date(data.last_run_at);
	const elapsed = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
	return elapsed >= minIntervalHours;
}

/**
 * Record that a job ran successfully.
 */
async function recordJobRun(admin: SupabaseClient, jobName: string, result: unknown) {
	await admin.from('cron_runs').upsert(
		{
			job_name: jobName,
			last_run_at: new Date().toISOString(),
			result: result as Record<string, unknown>,
		},
		{ onConflict: 'job_name' },
	);
}

// Jobs that should only run once per interval (hours)
const JOB_INTERVALS: Record<string, number> = {
	'generate-daily': 23,
	'generate-quests': 23,
	'weekly-digest': 144, // 6 days
	'compute-rankings': 23,
};

/**
 * POST /api/cron/run
 * Single entry point to trigger all cron jobs.
 * Designed to be pinged every 10 minutes, jobs with intervals are
 * automatically deduplicated via the cron_runs table.
 */
export async function POST(request: Request) {
	// Auth check
	const authHeader = request.headers.get('authorization');
	if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const requestedJobs: string[] | undefined = body.jobs;

	const admin = createAdminClient();
	const results: Record<string, unknown> = {};

	const allJobs: Record<string, () => Promise<unknown>> = {
		'sync-cf': () => syncAllCf(admin),
		'sync-lc': () => syncAllLc(admin),
		'update-streaks': () => runUpdateStreaks(admin),
		'generate-daily': () => runGenerateDaily(admin),
		'generate-quests': () => runGenerateQuests(admin),
		'weekly-digest': () => runWeeklyDigest(admin),
		'check-duels': () => runCheckDuels(admin),
		'compute-rankings': () => runComputeRankings(admin),
	};

	const jobsToRun = requestedJobs
		? requestedJobs.filter((j) => j in allJobs)
		: Object.keys(allJobs);

	for (const jobName of jobsToRun) {
		try {
			// Check interval-based dedup
			const minInterval = JOB_INTERVALS[jobName];
			if (minInterval) {
				const shouldRun = await shouldRunJob(admin, jobName, minInterval);
				if (!shouldRun) {
					results[jobName] = {
						skipped: true,
						reason: 'Too soon since last run',
					};
					continue;
				}
			}

			const start = Date.now();
			const result = await allJobs[jobName]();
			const duration = Date.now() - start;

			results[jobName] = {
				success: true,
				duration_ms: duration,
				result,
			};

			// Record successful run for interval-guarded jobs
			if (minInterval) {
				await recordJobRun(admin, jobName, result);
			}
		} catch (err) {
			results[jobName] = {
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error',
			};
		}
	}

	return NextResponse.json({
		success: true,
		timestamp: new Date().toISOString(),
		jobs: results,
	});
}

// Also support GET for simple cron triggers
export async function GET(request: Request) {
	const url = new URL(request.url);
	const secret = url.searchParams.get('secret');
	if (CRON_SECRET && secret !== CRON_SECRET) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const admin = createAdminClient();
	const results: Record<string, unknown> = {};

	// Frequent jobs only on GET, these are safe to run on every ping
	const jobs = [
		['sync-cf', () => syncAllCf(admin)],
		['sync-lc', () => syncAllLc(admin)],
		['update-streaks', () => runUpdateStreaks(admin)],
		['check-duels', () => runCheckDuels(admin)],
	] as const;

	for (const [name, fn] of jobs) {
		try {
			const start = Date.now();
			const result = await fn();
			results[name] = {
				success: true,
				duration_ms: Date.now() - start,
				result,
			};
		} catch (err) {
			results[name] = {
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error',
			};
		}
	}

	return NextResponse.json({ success: true, jobs: results });
}
