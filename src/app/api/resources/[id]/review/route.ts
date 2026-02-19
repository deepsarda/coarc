import { NextResponse } from 'next/server';
import { awardXP } from '@/lib/gamification/xp';
import { createNotification } from '@/lib/notifications/send';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { XP_REWARDS } from '@/lib/utils/constants';

/**
 * POST /api/resources/[id]/review
 * Approve or reject a resource (admin only).
 * Body: { action: "approve" | "reject" }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const resourceId = parseInt(id, 10);

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

		const { action } = await request.json();
		if (!['approve', 'reject'].includes(action)) {
			return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
		}

		const newStatus = action === 'approve' ? 'approved' : 'rejected';

		const { data: resource, error } = await admin
			.from('resources')
			.update({
				status: newStatus,
				approved_by: action === 'approve' ? user.id : null,
			})
			.eq('id', resourceId)
			.select()
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// If approved, award XP and notify submitter
		if (action === 'approve' && resource.submitted_by) {
			await awardXP(
				admin,
				resource.submitted_by,
				XP_REWARDS.RESOURCE_APPROVED,
				`Resource approved: ${resource.title}`,
				`resource_${resourceId}`,
			);

			await createNotification(
				admin,
				resource.submitted_by,
				'resource_approved',
				'📚 Resource Approved!',
				`Your resource "${resource.title}" was approved! +${XP_REWARDS.RESOURCE_APPROVED} XP`,
				{ resource_id: resourceId, url: '/resources' },
			);
		}

		return NextResponse.json({ success: true, resource });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
