import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/problems/[id]/react
 * Toggle a reaction on a shared problem. { reaction: "fire" | "brain" | "skull" }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const problemId = parseInt(id, 10);
		if (Number.isNaN(problemId)) {
			return NextResponse.json({ error: 'Invalid problem ID' }, { status: 400 });
		}

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { reaction } = await request.json();
		if (!['fire', 'brain', 'skull'].includes(reaction)) {
			return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
		}

		// Check if user already reacted with this reaction
		const { data: existing } = await supabase
			.from('problem_reactions')
			.select('id, reaction')
			.eq('problem_id', problemId)
			.eq('user_id', user.id)
			.single();

		if (existing) {
			if (existing.reaction === reaction) {
				// Same reaction → remove it (toggle off)
				await supabase.from('problem_reactions').delete().eq('id', existing.id);
				return NextResponse.json({ action: 'removed', reaction });
			}
			// Different reaction → update
			await supabase.from('problem_reactions').update({ reaction }).eq('id', existing.id);
			return NextResponse.json({ action: 'updated', reaction });
		}

		// No existing reaction → insert
		await supabase.from('problem_reactions').insert({
			problem_id: problemId,
			user_id: user.id,
			reaction,
		});

		return NextResponse.json({ action: 'added', reaction });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
