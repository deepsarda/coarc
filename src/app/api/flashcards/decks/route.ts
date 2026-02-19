import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/flashcards/decks
 * All flashcard decks with user progress summary.
 */
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const { data: decks } = await supabase
			.from("flashcard_decks")
			.select("*")
			.order("created_at", { ascending: false });

		if (!decks || decks.length === 0) {
			return NextResponse.json({ decks: [] });
		}

		// Get user's progress per deck
		const enriched = await Promise.all(
			decks.map(async (deck) => {
				const { data: cards } = await supabase
					.from("flashcards")
					.select("id")
					.eq("deck_id", deck.id);

				const cardIds = (cards ?? []).map((c) => c.id);

				let progress = { got_it: 0, needs_review: 0, unseen: 0 };
				if (cardIds.length > 0) {
					const { data: progressData } = await supabase
						.from("flashcard_progress")
						.select("status")
						.eq("user_id", user.id)
						.in("card_id", cardIds);

					const statusCounts = { got_it: 0, needs_review: 0, unseen: 0 };
					for (const p of progressData ?? []) {
						if (p.status in statusCounts) {
							statusCounts[p.status as keyof typeof statusCounts]++;
						}
					}
					statusCounts.unseen = cardIds.length - (progressData ?? []).length;
					progress = statusCounts;
				}

				return { ...deck, progress };
			}),
		);

		return NextResponse.json({ decks: enriched });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
