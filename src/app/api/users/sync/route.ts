import { NextResponse } from "next/server";
import { syncUserStats } from "@/lib/services/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/users/sync
 * Trigger a stats sync for the authenticated user.
 * Fetches latest data from Codeforces and LeetCode APIs.
 */
export async function POST() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		// Get the user's profile to find their handles
		const admin = createAdminClient();
		const { data: profile } = await admin
			.from("profiles")
			.select("cf_handle, lc_handle")
			.eq("id", user.id)
			.single();

		if (!profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

		if (!profile.cf_handle && !profile.lc_handle) {
			return NextResponse.json(
				{ error: "No handles linked", cf: null, lc: null },
				{ status: 400 },
			);
		}

		// Run the sync
		const result = await syncUserStats(
			admin,
			user.id,
			profile.cf_handle,
			profile.lc_handle,
		);

		return NextResponse.json({
			success: true,
			...result,
		});
	} catch (err) {
		console.error("Sync error:", err);
		return NextResponse.json({ error: "Sync failed" }, { status: 500 });
	}
}
