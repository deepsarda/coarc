import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/problems/feed?page=1&platform=cf|lc&tags=dp,greedy&difficulty=easy|medium|hard
 * Paginated problem feed (shared problems).
 */
export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get('page') ?? '1', 10);
		const limit = 20;
		const offset = (page - 1) * limit;
		const platform = url.searchParams.get('platform');
		const tagsParam = url.searchParams.get('tags');

		let query = supabase
			.from('shared_problems')
			.select('*, profiles:user_id(id, display_name)', { count: 'exact' })
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (platform) {
			query = query.eq('platform', platform);
		}

		if (tagsParam) {
			const tags = tagsParam.split(',').map((t) => t.trim());
			query = query.overlaps('tags', tags);
		}

		const { data: problems, error, count } = await query;

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Get reaction counts for these problems
		const problemIds = (problems ?? []).map((p) => p.id);
		const { data: reactions } = await supabase
			.from('problem_reactions')
			.select('problem_id, reaction')
			.in('problem_id', problemIds);

		// Get user's bookmarks for these problems
		const { data: bookmarks } = await supabase
			.from('problem_bookmarks')
			.select('problem_id')
			.eq('user_id', user.id)
			.in('problem_id', problemIds);

		const bookmarkSet = new Set((bookmarks ?? []).map((b) => b.problem_id));

		// Aggregate reactions
		const reactionCounts = new Map<number, Record<string, number>>();
		for (const r of reactions ?? []) {
			const counts = reactionCounts.get(r.problem_id) ?? {};
			counts[r.reaction] = (counts[r.reaction] ?? 0) + 1;
			reactionCounts.set(r.problem_id, counts);
		}

		// Check which ones the user reacted to
		const { data: userReactions } = await supabase
			.from('problem_reactions')
			.select('problem_id, reaction')
			.eq('user_id', user.id)
			.in('problem_id', problemIds);

		const userReactionMap = new Map<number, string>();
		for (const r of userReactions ?? []) {
			userReactionMap.set(r.problem_id, r.reaction);
		}

		const enriched = (problems ?? []).map((p) => ({
			...p,
			reaction_counts: reactionCounts.get(p.id) ?? {},
			user_reaction: userReactionMap.get(p.id) ?? null,
			user_bookmarked: bookmarkSet.has(p.id),
		}));

		return NextResponse.json({
			problems: enriched,
			page,
			total: count ?? 0,
			has_more: (count ?? 0) > offset + limit,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
