import { createCronHandler } from '@/app/api/cron/handler';
import { runCheckDuels } from '@/app/api/cron/run/jobs/check-duels';

export const GET = createCronHandler('check-duels', (admin) => runCheckDuels(admin));
