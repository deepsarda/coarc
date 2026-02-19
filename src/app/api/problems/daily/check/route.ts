import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/problems/daily/check?problem_id=123A
 * Check if the current user has solved a specific CF problem
 * by looking at their stored submissions.
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
		const problemId = url.searchParams.get('problem_id');
		if (!problemId) {
			return NextResponse.json({ error: 'problem_id required' }, { status: 400 });
		}

		// Check CF submissions for this problem
		const { data: cfSolve } = await supabase
			.from('cf_submissions')
			.select('id')
			.eq('user_id', user.id)
			.eq('problem_id', problemId)
			.eq('verdict', 'OK')
			.limit(1)
			.single();

		if (cfSolve) {
			return NextResponse.json({ solved: true, platform: 'codeforces' });
		}

		// Also check LC submissions if relevant
		const { data: lcSolve } = await supabase
			.from('lc_submissions')
			.select('id')
			.eq('user_id', user.id)
			.ilike('problem_slug', `%${problemId}%`)
			.eq('status', 'Accepted')
			.limit(1)
			.single();

		if (lcSolve) {
			return NextResponse.json({ solved: true, platform: 'leetcode' });
		}

		return NextResponse.json({ solved: false });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
