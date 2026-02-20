import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/daily - List upcoming/recent daily problems
 * POST /api/admin/daily - Set a daily problem for a specific date
 */
export async function GET() {
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

		// Get daily problems from the past week and future
		const pastDate = new Date();
		pastDate.setDate(pastDate.getDate() - 7);
		const pastStr = pastDate.toISOString().split('T')[0];

		const { data: dailies, error } = await admin
			.from('daily_problems')
			.select('*')
			.gte('date', pastStr)
			.order('date', { ascending: true });

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ dailies: dailies ?? [] });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

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

		const { date, problem_id, problem_name, problem_rating, problem_url, tags } =
			await request.json();

		if (!date || !problem_id || !problem_name || !problem_url) {
			return NextResponse.json(
				{
					error: 'Required fields: date, problem_id, problem_name, problem_url',
				},
				{ status: 400 },
			);
		}

		// Check if date already has a problem
		const { data: existing } = await admin
			.from('daily_problems')
			.select('id')
			.eq('date', date)
			.single();

		if (existing) {
			// Update existing
			const { data: daily, error } = await admin
				.from('daily_problems')
				.update({
					problem_id,
					problem_name,
					problem_rating: problem_rating ?? null,
					problem_url,
					tags: tags ?? [],
					is_admin_curated: true,
					created_by: user.id,
				})
				.eq('id', existing.id)
				.select()
				.single();

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 500 });
			}
			return NextResponse.json({ success: true, daily, updated: true });
		}

		// Insert new
		const { data: daily, error } = await admin
			.from('daily_problems')
			.insert({
				date,
				problem_id,
				problem_name,
				problem_rating: problem_rating ?? null,
				problem_url,
				tags: tags ?? [],
				is_admin_curated: true,
				created_by: user.id,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ success: true, daily, updated: false });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
