import type { SupabaseClient } from '@supabase/supabase-js';

export interface RecommendedProblem {
	slot: 'weak' | 'practice' | 'rusty' | 'stretch';
	label: string;
	reason: string;
	topic: string;
	platform: 'cf' | 'lc';
	problem: {
		id: string;
		name: string;
		rating: number | null;
		difficulty: string | null;
		tags: string[];
		url: string;
	};
	classmates_solved: number;
}

/**
 * Generate personalized problem recommendations for a user.
 * Returns CF recs and/or LC recs depending on what handles are set.
 */
export async function generateRecommendations(
	admin: SupabaseClient,
	userId: string,
): Promise<RecommendedProblem[]> {
	const { data: profile } = await admin
		.from('profiles')
		.select('cf_handle, lc_handle')
		.eq('id', userId)
		.single();

	if (!profile) return [];

	const results: RecommendedProblem[] = [];

	if (profile.cf_handle) {
		const cfRecs = await generateCfRecommendations(admin, userId);
		results.push(...cfRecs);
	}

	if (profile.lc_handle) {
		const lcRecs = await generateLcRecommendations(admin, userId);
		results.push(...lcRecs);
	}

	return results;
}

// =============================================
// CODEFORCES RECOMMENDATIONS
// =============================================

async function generateCfRecommendations(
	admin: SupabaseClient,
	userId: string,
): Promise<RecommendedProblem[]> {
	const { data: userSubs } = await admin
		.from('cf_submissions')
		.select('problem_id, tags, verdict')
		.eq('user_id', userId);

	if (!userSubs || userSubs.length === 0) return [];

	const solvedSet = new Set(userSubs.filter((s) => s.verdict === 'OK').map((s) => s.problem_id));

	// Topic analysis
	const topicSolves = new Map<string, number>();
	const topicAttempts = new Map<string, number>();

	for (const sub of userSubs) {
		const tags = (sub.tags as string[]) ?? [];
		for (const tag of tags) {
			topicAttempts.set(tag, (topicAttempts.get(tag) ?? 0) + 1);
			if (sub.verdict === 'OK') {
				topicSolves.set(tag, (topicSolves.get(tag) ?? 0) + 1);
			}
		}
	}

	const topicSuccessRate = new Map<string, number>();
	for (const [topic, attempts] of topicAttempts) {
		const solves = topicSolves.get(topic) ?? 0;
		topicSuccessRate.set(topic, attempts > 0 ? solves / attempts : 0);
	}

	const sortedTopics = [...topicSuccessRate.entries()].sort((a, b) => a[1] - b[1]);

	// Avg rating from solved
	const { data: solvedProblems } = await admin
		.from('cf_problems')
		.select('rating')
		.in('id', [...solvedSet].slice(0, 500))
		.not('rating', 'is', null);

	const ratings = (solvedProblems ?? []).map((p) => p.rating as number).filter(Boolean);
	const avgRating =
		ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 1200;

	const recommendations: RecommendedProblem[] = [];

	// Slot 1: Weak Topic
	if (sortedTopics.length > 0) {
		const [weakTopic, rate] = sortedTopics[0];
		const problem = await findCfProblem(
			admin,
			solvedSet,
			weakTopic,
			avgRating - 150,
			avgRating + 150,
		);
		if (problem) {
			const cs = await countCfClassmatesSolves(admin, problem.id, userId);
			recommendations.push({
				slot: 'weak',
				label: '🔴 Weak Topic',
				reason: `You've only solved ${Math.round(rate * 100)}% of your ${weakTopic} attempts`,
				topic: weakTopic,
				platform: 'cf',
				problem,
				classmates_solved: cs,
			});
		}
	}

	// Slot 2: Needs Practice
	if (sortedTopics.length > 1) {
		const [practiceTopic, rate] = sortedTopics[1];
		const problem = await findCfProblem(
			admin,
			solvedSet,
			practiceTopic,
			avgRating - 150,
			avgRating + 150,
		);
		if (problem) {
			const cs = await countCfClassmatesSolves(admin, problem.id, userId);
			recommendations.push({
				slot: 'practice',
				label: '⚠️ Needs Practice',
				reason: `Your ${practiceTopic} success rate is ${Math.round(rate * 100)}%`,
				topic: practiceTopic,
				platform: 'cf',
				problem,
				classmates_solved: cs,
			});
		}
	}

	// Slot 3: Rusty
	if (sortedTopics.length > 2) {
		const [rustyTopic] = sortedTopics[sortedTopics.length - 2];
		const problem = await findCfProblem(admin, solvedSet, rustyTopic, avgRating - 200, avgRating);
		if (problem) {
			const cs = await countCfClassmatesSolves(admin, problem.id, userId);
			recommendations.push({
				slot: 'rusty',
				label: '🧹 Rusty',
				reason: `Revisit ${rustyTopic} to keep your skills sharp`,
				topic: rustyTopic,
				platform: 'cf',
				problem,
				classmates_solved: cs,
			});
		}
	}

	// Slot 4: Stretch Goal
	if (sortedTopics.length > 0) {
		const strongestTopic = sortedTopics[sortedTopics.length - 1][0];
		const problem = await findCfProblem(
			admin,
			solvedSet,
			strongestTopic,
			avgRating + 150,
			avgRating + 350,
		);
		if (problem) {
			const cs = await countCfClassmatesSolves(admin, problem.id, userId);
			recommendations.push({
				slot: 'stretch',
				label: '🎯 Stretch Goal',
				reason: `Push your ceiling in ${strongestTopic}`,
				topic: strongestTopic,
				platform: 'cf',
				problem,
				classmates_solved: cs,
			});
		}
	}

	return recommendations;
}

// =============================================
// LEETCODE RECOMMENDATIONS
// =============================================

async function generateLcRecommendations(
	admin: SupabaseClient,
	userId: string,
): Promise<RecommendedProblem[]> {
	// Get user's LC stats to understand their difficulty breakdown
	const { data: lcStats } = await admin
		.from('lc_stats')
		.select('easy_solved, medium_solved, hard_solved, total_solved')
		.eq('user_id', userId)
		.single();

	if (!lcStats) return [];

	const totalSolved = lcStats.total_solved ?? 0;
	if (totalSolved === 0) {
		// Brand new, recommend an easy warmup
		const easyProblem = await findLcProblem(admin, 'Easy', null);
		if (!easyProblem) return [];
		return [
			{
				slot: 'weak',
				label: '🟢 Get Started',
				reason: 'Solve your first LeetCode problem!',
				topic: 'any',
				platform: 'lc',
				problem: easyProblem,
				classmates_solved: 0,
			},
		];
	}

	// Analyze difficulty gaps
	const easyRate = lcStats.easy_solved / Math.max(totalSolved, 1);
	const medRate = lcStats.medium_solved / Math.max(totalSolved, 1);
	const recommendations: RecommendedProblem[] = [];

	// Slot 1: Weak difficulty, whichever they've solved least proportionally
	if (lcStats.hard_solved === 0 && lcStats.medium_solved > 5) {
		// Hasn't tried hard yet but has some medium experience
		const problem = await findLcProblem(admin, 'Hard', null);
		if (problem) {
			recommendations.push({
				slot: 'weak',
				label: '🔴 Weak Area',
				reason: "You haven't solved any Hard problems yet!",
				topic: 'Hard',
				platform: 'lc',
				problem,
				classmates_solved: 0,
			});
		}
	} else if (medRate < 0.3) {
		const problem = await findLcProblem(admin, 'Medium', null);
		if (problem) {
			recommendations.push({
				slot: 'weak',
				label: '🔴 Weak Area',
				reason: `Only ${Math.round(medRate * 100)}% of your solves are Medium`,
				topic: 'Medium',
				platform: 'lc',
				problem,
				classmates_solved: 0,
			});
		}
	}

	// Slot 2: Practice, popular topic in their weak difficulty
	const practiceDifficulty = easyRate > 0.5 ? 'Medium' : 'Easy';
	const popularTopics = [
		'Array',
		'String',
		'Dynamic Programming',
		'Tree',
		'Graph',
		'Binary Search',
	];
	const randomTopic = popularTopics[Math.floor(Math.random() * popularTopics.length)];
	const practiceProblem = await findLcProblem(admin, practiceDifficulty, randomTopic);
	if (practiceProblem) {
		recommendations.push({
			slot: 'practice',
			label: '⚠️ Practice',
			reason: `Try a ${practiceDifficulty} ${randomTopic} problem`,
			topic: randomTopic,
			platform: 'lc',
			problem: practiceProblem,
			classmates_solved: 0,
		});
	}

	// Slot 3: Stretch Goal
	const stretchDifficulty = lcStats.hard_solved > 0 ? 'Hard' : 'Medium';
	const stretchTopics = ['Dynamic Programming', 'Graph', 'Trie', 'Segment Tree', 'Backtracking'];
	const stretchTopic = stretchTopics[Math.floor(Math.random() * stretchTopics.length)];
	const stretchProblem = await findLcProblem(admin, stretchDifficulty, stretchTopic);
	if (stretchProblem) {
		recommendations.push({
			slot: 'stretch',
			label: '🎯 Stretch Goal',
			reason: `Push yourself with a ${stretchDifficulty} ${stretchTopic} problem`,
			topic: stretchTopic,
			platform: 'lc',
			problem: stretchProblem,
			classmates_solved: 0,
		});
	}

	return recommendations;
}

// =============================================
// HELPERS
// =============================================

async function findCfProblem(
	admin: SupabaseClient,
	solvedSet: Set<string>,
	topic: string,
	minRating: number,
	maxRating: number,
): Promise<RecommendedProblem['problem'] | null> {
	const { data: problems } = await admin
		.from('cf_problems')
		.select('id, name, rating, tags, solved_count')
		.contains('tags', [topic])
		.gte('rating', minRating)
		.lte('rating', maxRating)
		.order('solved_count', { ascending: false, nullsFirst: false })
		.limit(50);

	if (!problems) return null;

	const unsolved = problems.find((p) => !solvedSet.has(p.id));
	if (!unsolved) return null;

	const contestId = unsolved.id.replace(/[A-Z]+.*/, '');
	const index = unsolved.id.replace(/^\d+/, '');

	return {
		id: unsolved.id,
		name: unsolved.name,
		rating: unsolved.rating,
		difficulty: null,
		tags: unsolved.tags ?? [],
		url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
	};
}

async function findLcProblem(
	admin: SupabaseClient,
	difficulty: string,
	topic: string | null,
): Promise<RecommendedProblem['problem'] | null> {
	let query = admin
		.from('lc_problems')
		.select('slug, title, difficulty, topics, total_accepted, url')
		.eq('difficulty', difficulty)
		.order('total_accepted', { ascending: false, nullsFirst: false })
		.limit(100);

	if (topic) {
		query = query.contains('topics', [topic]);
	}

	const { data: problems } = await query;
	if (!problems || problems.length === 0) return null;

	// Pick a random one from the top 100
	const problem = problems[Math.floor(Math.random() * problems.length)];

	return {
		id: problem.slug,
		name: problem.title,
		rating: null,
		difficulty: problem.difficulty,
		tags: problem.topics ?? [],
		url: problem.url ?? `https://leetcode.com/problems/${problem.slug}/`,
	};
}

async function countCfClassmatesSolves(
	admin: SupabaseClient,
	problemId: string,
	excludeUserId: string,
): Promise<number> {
	const { count } = await admin
		.from('cf_submissions')
		.select('id', { count: 'exact', head: true })
		.eq('problem_id', problemId)
		.eq('verdict', 'OK')
		.neq('user_id', excludeUserId);

	return count ?? 0;
}
