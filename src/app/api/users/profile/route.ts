import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch current user's profile
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { data: profile, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (error || !profile) {
			return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
		}

		return NextResponse.json({ profile });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// PUT: Update current user's profile
export async function PUT(request: Request) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
		}

		const body = await request.json();

		// Only allow updating specific fields
		const allowedFields = ['display_name', 'cf_handle', 'lc_handle', 'push_subscription'];
		const updates: Record<string, unknown> = {};

		for (const field of allowedFields) {
			if (field in body) {
				updates[field] = body[field];
			}
		}

		if (Object.keys(updates).length === 0) {
			return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
		}

		const { data: profile, error } = await supabase
			.from('profiles')
			.update(updates)
			.eq('id', user.id)
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ profile });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
