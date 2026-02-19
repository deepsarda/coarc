import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * List all users (admin only).
 */
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const admin = createAdminClient();
		const { data: profile } = await admin
			.from("profiles")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (!profile?.is_admin) {
			return NextResponse.json({ error: "Admin only" }, { status: 403 });
		}

		const { data: users } = await admin
			.from("profiles")
			.select("*")
			.order("roll_number");

		return NextResponse.json({ users: users ?? [] });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
