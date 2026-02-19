import { NextResponse } from "next/server";
import { notifyAllUsers } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/announcements/create
 * Create a new announcement (admin only).
 */
export async function POST(request: Request) {
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

		const { title, body, priority } = await request.json();

		if (!title || !body) {
			return NextResponse.json(
				{ error: "title and body required" },
				{ status: 400 },
			);
		}

		const { data: announcement, error } = await admin
			.from("announcements")
			.insert({
				title,
				body,
				priority: priority ?? "normal",
				created_by: user.id,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Notify all users
		await notifyAllUsers(
			admin,
			"announcement",
			`📢 ${title}`,
			body.length > 100 ? body.slice(0, 100) + "..." : body,
			{ announcement_id: announcement.id, url: "/announcements" },
		);

		return NextResponse.json({ success: true, announcement });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
