import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/notifications/read
 * Mark notifications as read. { ids?: number[], all?: boolean }
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

		const { ids, all } = await request.json();

		if (all) {
			await supabase
				.from("notifications")
				.update({ read: true })
				.eq("user_id", user.id)
				.eq("read", false);
		} else if (ids && Array.isArray(ids) && ids.length > 0) {
			await supabase
				.from("notifications")
				.update({ read: true })
				.eq("user_id", user.id)
				.in("id", ids);
		} else {
			return NextResponse.json(
				{ error: "ids or all=true required" },
				{ status: 400 },
			);
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
