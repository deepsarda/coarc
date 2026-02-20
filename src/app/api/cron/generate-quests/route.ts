import { createCronHandler } from '@/app/api/cron/handler';
import { runGenerateQuests } from '@/app/api/cron/run/jobs/generate-quests';

export const GET = createCronHandler('generate-quests', (admin) => runGenerateQuests(admin));
