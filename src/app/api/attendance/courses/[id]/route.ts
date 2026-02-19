import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * PUT /api/attendance/courses/[id] - Edit course (admin)
 * DELETE /api/attendance/courses/[id] - Archive course (admin)
 */
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const courseId = parseInt(id, 10);

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
		const allowed = [
			"name",
			"code",
			"color",
			"is_active",
			"classes_per_week",
			"semester_end",
		];
		const updates: Record<string, unknown> = {};
		for (const key of allowed) {
			if (key in body) updates[key] = body[key];
		}

		const { data: course, error } = await admin
			.from("courses")
			.update(updates)
			.eq("id", courseId)
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ course });
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
		const courseId = parseInt(id, 10);

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

		// Soft delete (archive)
		await admin.from("courses").update({ is_active: false }).eq("id", courseId);

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
