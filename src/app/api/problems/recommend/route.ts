import { NextResponse } from "next/server";
import { generateRecommendations } from "@/lib/gamification/recommender";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/problems/recommend
 * Get 4 personalized problem recommendations.
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

		const admin = createAdminClient();
		const recommendations = await generateRecommendations(admin, user.id);

		return NextResponse.json({ recommendations });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
