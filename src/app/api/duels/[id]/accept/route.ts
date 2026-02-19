import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/duels/[id]/accept
 * Accept a duel challenge.
 */
export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const duelId = parseInt(id, 10);

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const admin = createAdminClient();

		// Get the duel
		const { data: duel } = await admin
			.from("duels")
			.select("*")
			.eq("id", duelId)
			.single();

		if (!duel) {
			return NextResponse.json({ error: "Duel not found" }, { status: 404 });
		}

		if (duel.challenged_id !== user.id) {
			return NextResponse.json(
				{ error: "Not your duel to accept" },
				{ status: 403 },
			);
		}

		if (duel.status !== "pending") {
			return NextResponse.json(
				{ error: `Duel is ${duel.status}` },
				{ status: 400 },
			);
		}

		const now = new Date();
		const expiresAt = new Date(
			now.getTime() + duel.time_limit_minutes * 60 * 1000,
		);

		await admin
			.from("duels")
			.update({
				status: "active",
				started_at: now.toISOString(),
				expires_at: expiresAt.toISOString(),
			})
			.eq("id", duelId);

		// Build problem URL
		const contestId = duel.problem_id.replace(/[A-Z]+.*/, "");
		const index = duel.problem_id.replace(/^\d+/, "");
		const problemUrl = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

		return NextResponse.json({
			success: true,
			problem_id: duel.problem_id,
			problem_url: problemUrl,
			started_at: now.toISOString(),
			expires_at: expiresAt.toISOString(),
			time_limit_minutes: duel.time_limit_minutes,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
