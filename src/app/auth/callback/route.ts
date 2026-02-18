import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get('code');
	const next = searchParams.get('next') ?? '/dashboard';

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Check if profile exists
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				const { data: profile } = await supabase
					.from('profiles')
					.select('id')
					.eq('id', user.id)
					.single();

				// First-time user → setup page
				if (!profile) {
					return NextResponse.redirect(`${origin}/setup`);
				}
			}
			return NextResponse.redirect(`${origin}${next}`);
		}
	}

	// Auth error → redirect to login with error
	return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
