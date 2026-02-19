import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyAllUsers } from "@/lib/notifications/send";

// Topic rotation: Monday=DP, Tuesday=Graphs, etc.
const DAILY_TOPICS = [
	"dp",
	"graphs",
	"greedy",
	"math",
	"strings",
	"data structures",
	"number theory",
];

/**
 * Auto-generate today's daily problem if admin hasn't set one.
 */
export async function runGenerateDaily(admin: SupabaseClient) {
	const todayStr = new Date().toISOString().split("T")[0];

	// Check if already set
	const { data: existing } = await admin
		.from("daily_problems")
		.select("id")
		.eq("date", todayStr)
		.single();

	if (existing) return { skipped: true, reason: "Already set" };

	// Get class median CF rating
	const { data: ratings } = await admin
		.from("cf_ratings")
		.select("new_rating, user_id")
		.order("timestamp", { ascending: false });

	// Get latest rating per user
	const latestRatings = new Map<string, number>();
	for (const r of ratings ?? []) {
		if (!latestRatings.has(r.user_id)) {
			latestRatings.set(r.user_id, r.new_rating);
		}
	}

	const ratingValues = [...latestRatings.values()].sort((a, b) => a - b);
	const medianRating =
		ratingValues.length > 0
			? ratingValues[Math.floor(ratingValues.length / 2)]
			: 1200;

	// Pick topic by day of week
	const dayOfWeek = new Date().getDay(); // 0=Sun
	const topic = DAILY_TOPICS[(dayOfWeek + 6) % 7]; // Mon=0 index

	// Get previously used problem IDs
	const { data: usedProblems } = await admin
		.from("daily_problems")
		.select("problem_id");
	const usedSet = new Set((usedProblems ?? []).map((p) => p.problem_id));

	// Find a problem
	const { data: candidates } = await admin
		.from("cf_problems")
		.select("id, name, rating, tags, solved_count")
		.contains("tags", [topic])
		.gte("rating", medianRating - 200)
		.lte("rating", medianRating + 200)
		.order("solved_count", { ascending: false, nullsFirst: false })
		.limit(100);

	const problem = (candidates ?? []).find((p) => !usedSet.has(p.id));

	if (!problem) {
		return { skipped: true, reason: "No suitable problem found" };
	}

	// Insert daily problem
	const contestId = problem.id.replace(/[A-Z]+.*/, "");
	const index = problem.id.replace(/^\d+/, "");
	const problemUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

	await admin.from("daily_problems").insert({
		date: todayStr,
		problem_id: problem.id,
		problem_name: problem.name,
		problem_rating: problem.rating,
		problem_url: problemUrl,
		tags: problem.tags,
		is_admin_curated: false,
	});

	// Notify all users
	await notifyAllUsers(
		admin,
		"daily_problem",
		"🎯 Today's Problem is Ready!",
		`${problem.name} (${problem.rating ?? "?"}): ${topic}`,
		{ url: "/problems/daily" },
	);

	return { success: true, problem: problem.name };
}
