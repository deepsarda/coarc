import { createCronHandler } from '@/app/api/cron/handler';
import { runAttendanceReminder } from '@/app/api/cron/run/jobs/attendance-reminder';

export const GET = createCronHandler('attendance-reminder', (admin) =>
	runAttendanceReminder(admin),
);
