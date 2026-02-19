import type { SupabaseClient } from "@supabase/supabase-js";
import {
	processAllStreaks,
	sendStreakWarnings,
} from "@/lib/gamification/streaks";

/**
 * Daily streak update: process streaks, send warnings.
 */
export async function runUpdateStreaks(admin: SupabaseClient) {
	await processAllStreaks(admin);
	await sendStreakWarnings(admin);
	return { success: true };
}
