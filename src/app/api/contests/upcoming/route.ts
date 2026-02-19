import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/contests/upcoming
 * Fetch upcoming Codeforces contests from CF API.
 */
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Fetch from Codeforces API
		const res = await fetch('https://codeforces.com/api/contest.list?gym=false', {
			signal: AbortSignal.timeout(10000),
			next: { revalidate: 300 }, // Cache for 5 mins
		});

		if (!res.ok) {
			return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 502 });
		}

		const data = await res.json();
		if (data.status !== 'OK') {
			return NextResponse.json({ error: 'CF API error' }, { status: 502 });
		}

		// Filter to upcoming contests (phase = BEFORE)
		const upcoming = (data.result ?? [])
			.filter((c: { phase: string }) => c.phase === 'BEFORE')
			.slice(0, 10)
			.map(
				(c: {
					id: number;
					name: string;
					type: string;
					durationSeconds: number;
					startTimeSeconds: number;
				}) => ({
					id: c.id,
					name: c.name,
					type: c.type,
					duration_seconds: c.durationSeconds,
					start_time: new Date(c.startTimeSeconds * 1000).toISOString(),
				}),
			);

		// Get RSVPs for these contests from our DB
		const contestIds = upcoming.map((c: { id: number }) => c.id);
		const { data: rsvps } = await supabase
			.from('contest_rsvps')
			.select('contest_id, user_id')
			.in('contest_id', contestIds);

		// Count RSVPs and check user's RSVP per contest
		const rsvpCountMap = new Map<number, number>();
		const userRsvpSet = new Set<number>();

		for (const rsvp of rsvps ?? []) {
			rsvpCountMap.set(rsvp.contest_id, (rsvpCountMap.get(rsvp.contest_id) ?? 0) + 1);
			if (rsvp.user_id === user.id) {
				userRsvpSet.add(rsvp.contest_id);
			}
		}

		const enriched = upcoming.map((c: { id: number }) => ({
			...c,
			rsvp_count: rsvpCountMap.get(c.id) ?? 0,
			user_rsvped: userRsvpSet.has(c.id),
		}));

		return NextResponse.json({ contests: enriched });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
