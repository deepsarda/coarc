import { createCronHandler } from '@/app/api/cron/handler';
import { runComputeRankings } from '@/app/api/cron/run/jobs/compute-rankings';

export const GET = createCronHandler('compute-rankings', (admin) => runComputeRankings(admin));
