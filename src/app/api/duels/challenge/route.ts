import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { RATE_LIMITS } from "@/lib/utils/constants";
import { checkRateLimit } from "@/lib/utils/ratelimit";

/**
 * POST /api/duels/challenge
 * Create a duel challenge. Rate-limited to 5/day.
 * Body: { challenged_id, time_limit_minutes? }
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

		// Rate limit
		const rateCheck = await checkRateLimit(
			admin,
			user.id,
			"send_duel",
			RATE_LIMITS.SEND_DUEL,
		);
		if (!rateCheck.allowed) {
			return NextResponse.json(
				{ error: `Daily duel limit reached (${RATE_LIMITS.SEND_DUEL}/day)` },
				{ status: 429 },
			);
		}

		const { challenged_id, time_limit_minutes = 60 } = await request.json();

		if (!challenged_id) {
			return NextResponse.json(
				{ error: "challenged_id required" },
				{ status: 400 },
			);
		}

		if (challenged_id === user.id) {
			return NextResponse.json(
				{ error: "Cannot challenge yourself" },
				{ status: 400 },
			);
		}

		// Get both users' profiles
		const { data: profiles } = await admin
			.from("profiles")
			.select("id, cf_handle, display_name")
			.in("id", [user.id, challenged_id]);

		if (!profiles || profiles.length < 2) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const challenger = profiles.find((p) => p.id === user.id);
		const challenged = profiles.find((p) => p.id === challenged_id);

		if (!challenger?.cf_handle || !challenged?.cf_handle) {
			return NextResponse.json(
				{ error: "Both users must have CF handles linked" },
				{ status: 400 },
			);
		}

		// Auto-select a problem: find a CF problem near the average of both users' ratings
		const { data: challengerRating } = await admin
			.from("cf_ratings")
			.select("new_rating")
			.eq("user_id", user.id)
			.order("timestamp", { ascending: false })
			.limit(1)
			.single();

		const { data: challengedRating } = await admin
			.from("cf_ratings")
			.select("new_rating")
			.eq("user_id", challenged_id)
			.order("timestamp", { ascending: false })
			.limit(1)
			.single();

		const avgRating = Math.round(
			((challengerRating?.new_rating ?? 1200) +
				(challengedRating?.new_rating ?? 1200)) /
				2,
		);

		// Get both users' solved problems to exclude
		const { data: challengerSolves } = await admin
			.from("cf_submissions")
			.select("problem_id")
			.eq("user_id", user.id)
			.eq("verdict", "OK");
		const { data: challengedSolves } = await admin
			.from("cf_submissions")
			.select("problem_id")
			.eq("user_id", challenged_id)
			.eq("verdict", "OK");

		const solvedSet = new Set([
			...(challengerSolves ?? []).map((s) => s.problem_id),
			...(challengedSolves ?? []).map((s) => s.problem_id),
		]);

		const { data: candidates } = await admin
			.from("cf_problems")
			.select("id, name, rating, tags")
			.gte("rating", avgRating - 100)
			.lte("rating", avgRating + 200)
			.limit(100);

		const unsolved = (candidates ?? []).filter((p) => !solvedSet.has(p.id));
		const problem =
			unsolved.length > 0
				? unsolved[Math.floor(Math.random() * unsolved.length)]
				: (candidates ?? [])[0];

		if (!problem) {
			return NextResponse.json(
				{ error: "No suitable problem found for duel" },
				{ status: 404 },
			);
		}

		// Create duel
		const { data: duel, error } = await admin
			.from("duels")
			.insert({
				challenger_id: user.id,
				challenged_id,
				problem_id: problem.id,
				time_limit_minutes,
				status: "pending",
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Notify challenged user
		await createNotification(
			admin,
			challenged_id,
			"duel_challenge",
			"⚔️ Duel Challenge!",
			`${challenger.display_name} challenged you to a duel!`,
			{
				duel_id: duel.id,
				challenger_name: challenger.display_name,
				url: "/duels",
			},
		);

		return NextResponse.json({
			success: true,
			duel,
			problem_name: problem.name,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
