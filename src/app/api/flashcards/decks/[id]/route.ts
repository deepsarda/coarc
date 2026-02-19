import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/flashcards/decks/[id] - Get deck details
 * PUT /api/flashcards/decks/[id] - Update deck (admin)
 * DELETE /api/flashcards/decks/[id] - Delete deck (admin)
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const deckId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const { data: deck } = await supabase
			.from("flashcard_decks")
			.select("*")
			.eq("id", deckId)
			.single();

		if (!deck) {
			return NextResponse.json({ error: "Deck not found" }, { status: 404 });
		}

		return NextResponse.json({ deck });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const deckId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const admin = createAdminClient();
		const { data: profile } = await admin
			.from("profiles")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (!profile?.is_admin) {
			return NextResponse.json({ error: "Admin only" }, { status: 403 });
		}

		const body = await request.json();
		const allowed = ["title", "description", "tags"];
		const updates: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) updates[key] = body[key];
		}

		const { data: deck, error } = await admin
			.from("flashcard_decks")
			.update(updates)
			.eq("id", deckId)
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ deck });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const deckId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const admin = createAdminClient();
		const { data: profile } = await admin
			.from("profiles")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		if (!profile?.is_admin) {
			return NextResponse.json({ error: "Admin only" }, { status: 403 });
		}

		await admin.from("flashcards").delete().eq("deck_id", deckId);
		await admin.from("flashcard_decks").delete().eq("id", deckId);

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
