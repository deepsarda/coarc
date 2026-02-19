import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { RATE_LIMITS } from '@/lib/utils/constants';
import { checkRateLimit } from '@/lib/utils/ratelimit';

/**
 * POST /api/resources/submit
 * Submit a resource for approval. Rate-limited to 2/day.
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

		const rateCheck = await checkRateLimit(
			admin,
			user.id,
			'resource_submission',
			RATE_LIMITS.RESOURCE_SUBMISSION,
		);

		if (!rateCheck.allowed) {
			return NextResponse.json(
				{
					error: `Daily limit reached (${RATE_LIMITS.RESOURCE_SUBMISSION}/day)`,
				},
				{ status: 429 },
			);
		}

		const { title, url: resourceUrl, description, topic } = await request.json();

		if (!title || !resourceUrl || !topic) {
			return NextResponse.json({ error: 'title, url, and topic required' }, { status: 400 });
		}

		const { data: resource, error } = await admin
			.from('resources')
			.insert({
				title,
				url: resourceUrl,
				description: description ?? null,
				topic,
				submitted_by: user.id,
				status: 'pending',
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			resource,
			remaining: rateCheck.remaining - 1,
		});
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
