import type { SupabaseClient } from '@supabase/supabase-js';
import { type PushPayload, sendPush } from './push';

/**
 * Create an in-app notification and optionally send a web push.
 */
export async function createNotification(
	admin: SupabaseClient,
	userId: string,
	type: string,
	title: string,
	body: string,
	data?: Record<string, unknown>,
	sendPushNotification = true,
) {
	// Insert notification row
	const { error } = await admin.from('notifications').insert({
		user_id: userId,
		type,
		title,
		body,
		data: data ?? null,
		read: false,
		push_sent: false,
	});

	if (error) {
		console.error('[Notify] Insert failed:', error.message);
		return;
	}

	// Attempt web push
	if (sendPushNotification) {
		const { data: profile } = await admin
			.from('profiles')
			.select('push_subscription')
			.eq('id', userId)
			.single();

		if (profile?.push_subscription) {
			const payload: PushPayload = {
				title,
				body,
				url: (data?.url as string) ?? '/notifications',
				tag: type,
			};

			const sent = await sendPush(profile.push_subscription, payload);
			if (sent) {
				// Mark push_sent on the most recent notification
				await admin
					.from('notifications')
					.update({ push_sent: true })
					.eq('user_id', userId)
					.eq('type', type)
					.order('created_at', { ascending: false })
					.limit(1);
			}
		}
	}
}

/**
 * Send a notification to ALL users.
 */
export async function notifyAllUsers(
	admin: SupabaseClient,
	type: string,
	title: string,
	body: string,
	data?: Record<string, unknown>,
) {
	const { data: profiles } = await admin.from('profiles').select('id, push_subscription');

	if (!profiles) return;

	// Batch insert notifications
	const rows = profiles.map((p) => ({
		user_id: p.id,
		type,
		title,
		body,
		data: data ?? null,
		read: false,
		push_sent: false,
	}));

	await admin.from('notifications').insert(rows);

	// Send pushes in parallel (non-blocking)
	const pushPromises = profiles
		.filter((p) => p.push_subscription)
		.map((p) =>
			sendPush(p.push_subscription, {
				title,
				body,
				url: (data?.url as string) ?? '/notifications',
				tag: type,
			}).catch(() => {}),
		);

	await Promise.allSettled(pushPromises);
}
