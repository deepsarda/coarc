import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { parseCSV } from '@/lib/utils/csv';

/**
 * POST /api/flashcards/decks/upload
 * Upload a CSV deck (admin only).
 * Body: { title, description?, tags?, csv_content }
 */
export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const admin = createAdminClient();
		const { data: profile } = await admin
			.from('profiles')
			.select('is_admin')
			.eq('id', user.id)
			.single();

		if (!profile?.is_admin) {
			return NextResponse.json({ error: 'Admin only' }, { status: 403 });
		}

		const { title, description, tags, csv_content } = await request.json();

		if (!title || !csv_content) {
			return NextResponse.json({ error: 'title and csv_content required' }, { status: 400 });
		}

		// Parse CSV
		const cards = parseCSV(csv_content);

		if (cards.length === 0) {
			return NextResponse.json({ error: 'No valid cards found in CSV' }, { status: 400 });
		}

		// Create deck
		const { data: deck, error: deckError } = await admin
			.from('flashcard_decks')
			.insert({
				title,
				description: description ?? null,
				tags: tags ?? [],
				card_count: cards.length,
				created_by: user.id,
			})
			.select()
			.single();

		if (deckError) {
			return NextResponse.json({ error: deckError.message }, { status: 500 });
		}

		// Insert cards
		const cardRows = cards.map((card, index) => ({
			deck_id: deck.id,
			front: card.front,
			back: card.back,
			position: index,
		}));

		const { error: cardError } = await admin.from('flashcards').insert(cardRows);

		if (cardError) {
			return NextResponse.json({ error: cardError.message }, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			deck,
			cards_created: cards.length,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
