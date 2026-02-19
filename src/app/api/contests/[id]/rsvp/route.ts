import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/contests/[id]/rsvp
 * Toggle RSVP for a contest.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const contestId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Check if already RSVPed
		const { data: existing } = await supabase
			.from('contest_rsvps')
			.select('id')
			.eq('user_id', user.id)
			.eq('contest_id', contestId)
			.single();

		if (existing) {
			// Un-RSVP
			await supabase.from('contest_rsvps').delete().eq('id', existing.id);
			return NextResponse.json({ action: 'removed', rsvped: false });
		}

		// RSVP
		await supabase.from('contest_rsvps').insert({
			user_id: user.id,
			contest_id: contestId,
		});

		return NextResponse.json({ action: 'added', rsvped: true });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
