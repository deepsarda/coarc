import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/gamification/xp-log?page=1
 * XP transaction history for the current user.
 */
export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") ?? "1", 10);
		const limit = 30;
		const offset = (page - 1) * limit;

		const { data: logs, count } = await supabase
			.from("xp_log")
			.select("*", { count: "exact" })
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		return NextResponse.json({
			logs: logs ?? [],
			page,
			total: count ?? 0,
			has_more: (count ?? 0) > offset + limit,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
