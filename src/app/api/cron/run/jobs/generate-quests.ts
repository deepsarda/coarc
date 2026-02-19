import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Auto-generate weekly quests if admin hasn't curated ones for this week.
 * Analyzes class-wide weak topics and generates 3 quests.
 */
export async function runGenerateQuests(admin: SupabaseClient) {
	// Get current week start (Monday)
	const now = new Date();
	const dayOfWeek = now.getDay();
	const monday = new Date(now);
	monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
	monday.setHours(0, 0, 0, 0);
	const weekStartStr = monday.toISOString().split('T')[0];

	// Check if quests already exist for this week
	const { data: existing } = await admin.from('quests').select('id').eq('week_start', weekStartStr);

	if (existing && existing.length > 0) {
		return { skipped: true, reason: 'Quests already exist for this week' };
	}

	// Analyze class-wide topic weaknesses
	const { data: allSubs } = await admin.from('cf_submissions').select('tags, verdict');

	const topicSolves = new Map<string, number>();
	const topicAttempts = new Map<string, number>();

	for (const sub of allSubs ?? []) {
		const tags = (sub.tags as string[]) ?? [];
		for (const tag of tags) {
			topicAttempts.set(tag, (topicAttempts.get(tag) ?? 0) + 1);
			if (sub.verdict === 'OK') {
				topicSolves.set(tag, (topicSolves.get(tag) ?? 0) + 1);
			}
		}
	}

	// Sort topics by success rate (ascending = weakest)
	const topicRates = [...topicAttempts.entries()]
		.map(([topic, attempts]) => ({
			topic,
			rate: (topicSolves.get(topic) ?? 0) / attempts,
			attempts,
		}))
		.filter((t) => t.attempts >= 5) // Only topics with some data
		.sort((a, b) => a.rate - b.rate);

	const quests: {
		title: string;
		description: string;
		quest_type: string;
		condition: Record<string, unknown>;
		xp_reward: number;
	}[] = [];

	// Quest 1: Topic quest (weakest topic)
	if (topicRates.length > 0) {
		const weakest = topicRates[0];
		quests.push({
			title: `${capitalize(weakest.topic)} Practice`,
			description: `Solve 3 ${weakest.topic} problems this week`,
			quest_type: 'topic',
			condition: {
				type: 'solve_topic',
				topic: weakest.topic,
				count: 3,
			},
			xp_reward: 50,
		});
	}

	// Quest 2: Difficulty quest
	quests.push({
		title: 'Level Up Challenge',
		description: 'Solve a problem rated 1400+ on Codeforces',
		quest_type: 'difficulty',
		condition: {
			type: 'solve_rating',
			min_rating: 1400,
			count: 1,
		},
		xp_reward: 50,
	});

	// Quest 3: Social quest
	quests.push({
		title: 'Knowledge Sharing',
		description: 'Share a problem with your classmates',
		quest_type: 'social',
		condition: {
			type: 'share_problem',
			count: 1,
		},
		xp_reward: 50,
	});

	// Insert quests
	const questRows = quests.map((q) => ({
		...q,
		week_start: weekStartStr,
		is_admin_curated: false,
	}));

	await admin.from('quests').insert(questRows);

	// Create user_quests entries for all users
	const { data: insertedQuests } = await admin
		.from('quests')
		.select('id')
		.eq('week_start', weekStartStr);

	if (insertedQuests) {
		const { data: allUsers } = await admin.from('profiles').select('id');
		if (allUsers) {
			const userQuestRows = allUsers.flatMap((user) =>
				insertedQuests.map((quest) => ({
					user_id: user.id,
					quest_id: quest.id,
					progress: 0,
					completed: false,
				})),
			);
			await admin.from('user_quests').upsert(userQuestRows, {
				onConflict: 'user_id,quest_id',
			});
		}
	}

	return { success: true, quests_created: quests.length };
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
