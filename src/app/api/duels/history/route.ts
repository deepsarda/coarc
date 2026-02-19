import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/duels/history?status=completed|pending|active
 * Duel history for the current user.
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
		const status = url.searchParams.get("status");

		let query = supabase
			.from("duels")
			.select(`
				*,
				challenger:challenger_id(id, display_name, cf_handle),
				challenged:challenged_id(id, display_name, cf_handle)
			`)
			.or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
			.order("created_at", { ascending: false });

		if (status) {
			query = query.eq("status", status);
		}

		const { data: duels, error } = await query.limit(50);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Compute win/loss/draw stats
		const completedDuels = (duels ?? []).filter(
			(d) => d.status === "completed",
		);
		const stats = {
			total: completedDuels.length,
			wins: completedDuels.filter((d) => d.winner_id === user.id).length,
			losses: completedDuels.filter(
				(d) => d.winner_id && d.winner_id !== user.id,
			).length,
			draws: completedDuels.filter((d) => !d.winner_id).length,
		};

		return NextResponse.json({ duels: duels ?? [], stats });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
