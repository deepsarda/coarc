import { createClient } from '@supabase/supabase-js';

// Service-role client for cron jobs and admin operations
// WARNING: This client bypasses Row Level Security, use only in server-side code
export function createAdminClient() {
	return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
