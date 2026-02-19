import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/announcements/list?page=1
 * All announcements, paginated.
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
		const limit = 20;
		const offset = (page - 1) * limit;

		const { data: announcements, count } = await supabase
			.from("announcements")
			.select("*, profiles:created_by(display_name)", { count: "exact" })
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		return NextResponse.json({
			announcements: announcements ?? [],
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
