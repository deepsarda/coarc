import { NextResponse } from "next/server";
import { awardXP } from "@/lib/gamification/xp";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS } from "@/lib/utils/constants";

/**
 * POST /api/flashcards/progress
 * Update card progress. { card_id, status: "got_it"|"needs_review" }
 */
export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const { card_id, status } = await request.json();

		if (!card_id || !["got_it", "needs_review"].includes(status)) {
			return NextResponse.json(
				{ error: "card_id and valid status required" },
				{ status: 400 },
			);
		}

		const admin = createAdminClient();

		// Check if this is the user's first interaction with this deck
		const { data: card } = await admin
			.from("flashcards")
			.select("deck_id")
			.eq("id", card_id)
			.single();

		let firstDeckInteraction = false;
		if (card) {
			const { data: existingProgress } = await admin
				.from("flashcard_progress")
				.select("id")
				.eq("user_id", user.id)
				.in(
					"card_id",
					(
						await admin
							.from("flashcards")
							.select("id")
							.eq("deck_id", card.deck_id)
					).data?.map((c) => c.id) ?? [],
				)
				.limit(1);

			firstDeckInteraction = !existingProgress || existingProgress.length === 0;
		}

		// Upsert progress
		await admin.from("flashcard_progress").upsert(
			{
				user_id: user.id,
				card_id,
				status,
				last_reviewed_at: new Date().toISOString(),
			},
			{ onConflict: "user_id,card_id" },
		);

		// Award XP for first deck interaction
		if (firstDeckInteraction) {
			await awardXP(
				admin,
				user.id,
				XP_REWARDS.FLASHCARD_DECK_FIRST,
				"First flashcard review in deck",
				`flashcard_deck_${card?.deck_id}`,
			);
		}

		return NextResponse.json({
			success: true,
			xp_earned: firstDeckInteraction ? XP_REWARDS.FLASHCARD_DECK_FIRST : 0,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
