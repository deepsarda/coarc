import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/problems/random?min_rating=1200&max_rating=1800&topics=dp,greedy&unsolved=true
 * Random problem spinner.
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
		const minRating = parseInt(url.searchParams.get("min_rating") ?? "800", 10);
		const maxRating = parseInt(
			url.searchParams.get("max_rating") ?? "2000",
			10,
		);
		const topicsParam = url.searchParams.get("topics");
		const unsolvedOnly = url.searchParams.get("unsolved") === "true";

		let query = supabase
			.from("cf_problems")
			.select("id, name, rating, tags, solved_count")
			.gte("rating", minRating)
			.lte("rating", maxRating);

		if (topicsParam) {
			const topics = topicsParam.split(",").map((t) => t.trim());
			query = query.overlaps("tags", topics);
		}

		const { data: problems } = await query.limit(500);

		if (!problems || problems.length === 0) {
			return NextResponse.json(
				{ error: "No matching problems found" },
				{ status: 404 },
			);
		}

		let candidates = problems;

		if (unsolvedOnly) {
			// Get user's solved problem IDs
			const { data: userSubs } = await supabase
				.from("cf_submissions")
				.select("problem_id")
				.eq("user_id", user.id)
				.eq("verdict", "OK");

			const solvedSet = new Set((userSubs ?? []).map((s) => s.problem_id));
			candidates = problems.filter((p) => !solvedSet.has(p.id));

			if (candidates.length === 0) {
				return NextResponse.json(
					{ error: "No unsolved problems matching criteria" },
					{ status: 404 },
				);
			}
		}

		// Pick random
		const randomIndex = Math.floor(Math.random() * candidates.length);
		const problem = candidates[randomIndex];

		// Build URL
		const contestId = problem.id.replace(/[A-Z]+.*/, "");
		const index = problem.id.replace(/^\d+/, "");
		const problemUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

		return NextResponse.json({
			problem: {
				...problem,
				url: problemUrl,
			},
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
