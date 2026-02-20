import { createCronHandler } from '@/app/api/cron/handler';
import { runGenerateDaily } from '@/app/api/cron/run/jobs/generate-daily';

export const GET = createCronHandler('generate-daily', (admin) => runGenerateDaily(admin));
