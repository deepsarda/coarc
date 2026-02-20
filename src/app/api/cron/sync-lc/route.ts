import { createCronHandler } from '@/app/api/cron/handler';
import { syncAllLc } from '@/app/api/cron/run/jobs/sync-lc';

export const GET = createCronHandler('sync-lc', (admin) => syncAllLc(admin));
