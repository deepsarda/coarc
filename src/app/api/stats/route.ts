import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Public stats endpoint returns user count and genesis badge slots remaining.
 * Used by the landing page to show live data.
 */
export async function GET() {
	try {
		const admin = createAdminClient();

		const [profilesResult, genesisResult] = await Promise.all([
			admin.from('profiles').select('id', { count: 'exact', head: true }),
			admin
				.from('user_badges')
				.select('id', { count: 'exact', head: true })
				.eq('badge_id', 'genesis'),
		]);

		const userCount = profilesResult.count ?? 0;
		const genesisClaimed = genesisResult.count ?? 0;
		const genesisLimit = 20;

		return NextResponse.json({
			userCount,
			genesisClaimed,
			genesisRemaining: Math.max(0, genesisLimit - genesisClaimed),
			genesisLimit,
		});
	} catch (err) {
		console.error('Stats error:', err);
		return NextResponse.json(
			{
				userCount: 0,
				genesisClaimed: 0,
				genesisRemaining: 20,
				genesisLimit: 20,
			},
			{ status: 500 },
		);
	}
}
