import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/duels/[id]/decline
 * Decline a duel challenge.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const duelId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const admin = createAdminClient();

		const { data: duel } = await admin
			.from('duels')
			.select('challenged_id, status')
			.eq('id', duelId)
			.single();

		if (!duel) {
			return NextResponse.json({ error: 'Duel not found' }, { status: 404 });
		}

		if (duel.challenged_id !== user.id) {
			return NextResponse.json({ error: 'Not your duel' }, { status: 403 });
		}

		if (duel.status !== 'pending') {
			return NextResponse.json({ error: `Duel is ${duel.status}` }, { status: 400 });
		}

		await admin.from('duels').update({ status: 'declined' }).eq('id', duelId);

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
