import { createCronHandler } from '@/app/api/cron/handler';
import { runUpdateStreaks } from '@/app/api/cron/run/jobs/update-streaks';

export const GET = createCronHandler('update-streaks', (admin) => runUpdateStreaks(admin));
