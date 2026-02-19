import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/users/compare?id1=xxx&id2=yyy
 * Head-to-head comparison of two users.
 */
export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const url = new URL(request.url);
		const id1 = url.searchParams.get("id1");
		const id2 = url.searchParams.get("id2");

		if (!id1 || !id2) {
			return NextResponse.json(
				{ error: "Both id1 and id2 are required" },
				{ status: 400 },
			);
		}

		const [
			p1Result,
			p2Result,
			p1Badges,
			p2Badges,
			p1cfRating,
			p2cfRating,
			p1lcStats,
			p2lcStats,
		] = await Promise.all([
			supabase.from("profiles").select("*").eq("id", id1).single(),
			supabase.from("profiles").select("*").eq("id", id2).single(),
			supabase.from("user_badges").select("badge_id").eq("user_id", id1),
			supabase.from("user_badges").select("badge_id").eq("user_id", id2),
			supabase
				.from("cf_ratings")
				.select("new_rating")
				.eq("user_id", id1)
				.order("timestamp", { ascending: false })
				.limit(1),
			supabase
				.from("cf_ratings")
				.select("new_rating")
				.eq("user_id", id2)
				.order("timestamp", { ascending: false })
				.limit(1),
			supabase
				.from("lc_stats")
				.select("total_solved, easy_solved, medium_solved, hard_solved")
				.eq("user_id", id1)
				.single(),
			supabase
				.from("lc_stats")
				.select("total_solved, easy_solved, medium_solved, hard_solved")
				.eq("user_id", id2)
				.single(),
		]);

		if (!p1Result.data || !p2Result.data) {
			return NextResponse.json(
				{ error: "One or both users not found" },
				{ status: 404 },
			);
		}

		// Count duels between them
		const { data: duels } = await supabase
			.from("duels")
			.select("winner_id, status")
			.eq("status", "completed")
			.or(`challenger_id.eq.${id1},challenged_id.eq.${id1}`)
			.or(`challenger_id.eq.${id2},challenged_id.eq.${id2}`);

		const h2hDuels = (duels ?? []).filter(
			(d) =>
				(d.winner_id === id1 || d.winner_id === id2) &&
				d.status === "completed",
		);

		return NextResponse.json({
			user1: {
				profile: p1Result.data,
				badges_count: p1Badges.data?.length ?? 0,
				cf_rating: p1cfRating.data?.[0]?.new_rating ?? null,
				lc_stats: p1lcStats.data ?? null,
			},
			user2: {
				profile: p2Result.data,
				badges_count: p2Badges.data?.length ?? 0,
				cf_rating: p2cfRating.data?.[0]?.new_rating ?? null,
				lc_stats: p2lcStats.data ?? null,
			},
			h2h: {
				total_duels: h2hDuels.length,
				user1_wins: h2hDuels.filter((d) => d.winner_id === id1).length,
				user2_wins: h2hDuels.filter((d) => d.winner_id === id2).length,
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
