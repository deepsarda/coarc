import { createCronHandler } from '@/app/api/cron/handler';
import { syncAllCf } from '@/app/api/cron/run/jobs/sync-cf';

export const GET = createCronHandler('sync-cf', (admin) => syncAllCf(admin));
