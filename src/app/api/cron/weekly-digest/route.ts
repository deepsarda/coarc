import { createCronHandler } from '@/app/api/cron/handler';
import { runWeeklyDigest } from '@/app/api/cron/run/jobs/weekly-digest';

export const GET = createCronHandler('weekly-digest', (admin) => runWeeklyDigest(admin));
