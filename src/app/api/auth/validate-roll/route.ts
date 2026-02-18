import { NextResponse } from 'next/server';
import { ROLL } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
	try {
		const { rollNumber } = await request.json();
		const roll = parseInt(rollNumber, 10);

		if (!ROLL.isValid(roll)) {
			return NextResponse.json(
				{
					error: `Invalid roll number. Must be between ${String(ROLL.min).padStart(2, '0')} and ${ROLL.max}.`,
				},
				{ status: 400 },
			);
		}

		const email = ROLL.toEmail(roll);

		// Send magic link via Supabase
		const supabase = await createClient();
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
			},
		});

		if (error) {
			console.error('Magic link error:', error);
			return NextResponse.json({ error: 'Failed to send magic link. Try again.' }, { status: 500 });
		}

		return NextResponse.json({ email, success: true });
	} catch {
		return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
	}
}
