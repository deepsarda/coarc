/**
 * scripts/load-problems.ts
 *
 * Bulk-load Codeforces and LeetCode problems into the database.
 * Run with: npx tsx scripts/load-problems.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error(
		"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local",
	);
	process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
// CODEFORCES
// =============================================

async function loadCfProblems() {
	console.log("📦 Fetching Codeforces problems...");

	const res = await fetch("https://codeforces.com/api/problemset.problems");
	if (!res.ok) {
		console.error("Failed to fetch CF problems:", res.status);
		return;
	}

	const data = await res.json();
	if (data.status !== "OK") {
		console.error("CF API returned error:", data.comment);
		return;
	}

	const problems = data.result.problems as {
		contestId: number;
		index: string;
		name: string;
		rating?: number;
		tags: string[];
	}[];

	const stats = data.result.problemStatistics as {
		contestId: number;
		index: string;
		solvedCount: number;
	}[];

	// Build solved count map
	const solvedMap = new Map<string, number>();
	for (const s of stats) {
		solvedMap.set(`${s.contestId}${s.index}`, s.solvedCount);
	}

	console.log(`  Found ${problems.length} CF problems. Upserting...`);

	// Batch upsert in chunks of 500
	const rows = problems.map((p) => ({
		id: `${p.contestId}${p.index}`,
		name: p.name,
		rating: p.rating ?? null,
		tags: p.tags,
		solved_count: solvedMap.get(`${p.contestId}${p.index}`) ?? null,
		contest_id: p.contestId,
	}));

	let inserted = 0;
	const BATCH_SIZE = 500;

	for (let i = 0; i < rows.length; i += BATCH_SIZE) {
		const batch = rows.slice(i, i + BATCH_SIZE);
		const { error } = await admin
			.from("cf_problems")
			.upsert(batch, { onConflict: "id" });

		if (error) {
			console.error(`  Batch ${i / BATCH_SIZE + 1} error:`, error.message);
		} else {
			inserted += batch.length;
		}

		// Progress
		const pct = Math.round(((i + batch.length) / rows.length) * 100);
		process.stdout.write(`\r  Progress: ${pct}% (${inserted}/${rows.length})`);
	}

	console.log(`\nCF: ${inserted} problems loaded.`);
}

// =============================================
// LEETCODE
// =============================================

async function loadLcProblems() {
	console.log("📦 Fetching LeetCode problems...");

	let skip = 0;
	const limit = 100;
	let totalLoaded = 0;
	let totalProblems = 0;

	// LeetCode GraphQL endpoint
	const LC_URL = "https://leetcode.com/graphql";

	while (true) {
		const query = `
			query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int) {
				problemsetQuestionList: questionList(
					categorySlug: $categorySlug
					limit: $limit
					skip: $skip
					filters: {}
				) {
					total: totalNum
					questions: data {
						titleSlug
						title
						difficulty
						topicTags { slug name }
						acRate
						likes
					}
				}
			}
		`;

		try {
			const res = await fetch(LC_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Referer: "https://leetcode.com",
					Origin: "https://leetcode.com",
				},
				body: JSON.stringify({
					query,
					variables: {
						categorySlug: "all-code-essentials",
						limit,
						skip,
					},
				}),
			});

			if (!res.ok) {
				console.error(`  LC API returned ${res.status} at skip=${skip}`);
				break;
			}

			const data = await res.json();
			const result = data.data?.problemsetQuestionList;

			if (!result || !result.questions || result.questions.length === 0) {
				break;
			}

			totalProblems = result.total;

			const rows = result.questions.map(
				(q: {
					titleSlug: string;
					title: string;
					difficulty: string;
					topicTags: { slug: string; name: string }[];
					acRate: number;
					likes: number;
				}) => ({
					slug: q.titleSlug,
					title: q.title,
					difficulty: q.difficulty,
					topics: q.topicTags.map((t: { name: string }) => t.name),
					total_accepted: null,
					total_submitted: null,
					likes: q.likes ?? null,
					url: `https://leetcode.com/problems/${q.titleSlug}/`,
				}),
			);

			const { error } = await admin
				.from("lc_problems")
				.upsert(rows, { onConflict: "slug" });

			if (error) {
				console.error(`  Batch at skip=${skip} error:`, error.message);
			} else {
				totalLoaded += rows.length;
			}

			const pct = Math.round(
				(Math.min(skip + limit, totalProblems) / totalProblems) * 100,
			);
			process.stdout.write(
				`\r  Progress: ${pct}% (${totalLoaded}/${totalProblems})`,
			);

			skip += limit;

			if (skip >= totalProblems) break;

			// Small delay to be respectful
			await new Promise((r) => setTimeout(r, 500));
		} catch (err) {
			console.error(`  Error at skip=${skip}:`, err);
			break;
		}
	}

	console.log(`\n✅ LC: ${totalLoaded} problems loaded.`);
}

// =============================================
// MAIN
// =============================================

async function main() {
	console.log("🚀 co.arc Problem Loader\n");

	const args = process.argv.slice(2);
	const cfOnly = args.includes("--cf");
	const lcOnly = args.includes("--lc");
	const both = !cfOnly && !lcOnly;

	if (both || cfOnly) {
		await loadCfProblems();
	}

	if (both || lcOnly) {
		await loadLcProblems();
	}

	console.log("\n🎉 Done!");
}

main().catch(console.error);
