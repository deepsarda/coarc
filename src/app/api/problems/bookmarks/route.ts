import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/problems/bookmarks?list=want_to_solve|revisit_later
 * POST /api/problems/bookmarks { problem_id, list_type }
 * DELETE /api/problems/bookmarks { problem_id }
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
		const listType = url.searchParams.get("list");

		let query = supabase
			.from("problem_bookmarks")
			.select("*, shared_problems:problem_id(*)")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false });

		if (listType) {
			query = query.eq("list_type", listType);
		}

		const { data: bookmarks, error } = await query;

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ bookmarks: bookmarks ?? [] });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const { problem_id, list_type } = await request.json();
		if (!problem_id || !list_type) {
			return NextResponse.json(
				{ error: "problem_id and list_type required" },
				{ status: 400 },
			);
		}

		const { data, error } = await supabase
			.from("problem_bookmarks")
			.upsert(
				{
					user_id: user.id,
					problem_id,
					list_type,
					solved: false,
				},
				{ onConflict: "user_id,problem_id" },
			)
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ bookmark: data });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const { problem_id } = await request.json();
		if (!problem_id) {
			return NextResponse.json(
				{ error: "problem_id required" },
				{ status: 400 },
			);
		}

		await supabase
			.from("problem_bookmarks")
			.delete()
			.eq("user_id", user.id)
			.eq("problem_id", problem_id);

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
