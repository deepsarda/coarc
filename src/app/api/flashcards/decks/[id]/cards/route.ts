import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/flashcards/decks/[id]/cards
 * Get all cards in a deck with user's progress.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const deckId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { data: cards } = await supabase
			.from('flashcards')
			.select('*')
			.eq('deck_id', deckId)
			.order('position');

		if (!cards) {
			return NextResponse.json({ cards: [] });
		}

		// Get user's progress
		const cardIds = cards.map((c) => c.id);
		const { data: progress } = await supabase
			.from('flashcard_progress')
			.select('card_id, status, last_reviewed_at')
			.eq('user_id', user.id)
			.in('card_id', cardIds);

		const progressMap = new Map((progress ?? []).map((p) => [p.card_id, p]));

		const enriched = cards.map((card) => ({
			...card,
			user_status: progressMap.get(card.id)?.status ?? 'unseen',
			last_reviewed_at: progressMap.get(card.id)?.last_reviewed_at ?? null,
		}));

		return NextResponse.json({ cards: enriched });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
