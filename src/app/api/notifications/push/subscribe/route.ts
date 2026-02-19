import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/notifications/push/subscribe
 * Register or update push subscription.
 * Body: { subscription: PushSubscription }
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

		const { subscription } = await request.json();

		if (!subscription || !subscription.endpoint) {
			return NextResponse.json(
				{ error: "Valid subscription required" },
				{ status: 400 },
			);
		}

		const { error } = await supabase
			.from("profiles")
			.update({ push_subscription: subscription })
			.eq("id", user.id);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
