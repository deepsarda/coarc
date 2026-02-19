import webpush from 'web-push';

export interface PushPayload {
	title: string;
	body: string;
	icon?: string;
	url?: string;
	tag?: string;
}

let vapidInitialized = false;

function ensureVapid(): boolean {
	if (vapidInitialized) return true;

	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	const email = process.env.VAPID_EMAIL ?? 'mailto:admin@coarc.dev';

	if (!publicKey || !privateKey || publicKey.length < 10 || privateKey.length < 10) {
		return false;
	}

	try {
		webpush.setVapidDetails(email, publicKey, privateKey);
		vapidInitialized = true;
		return true;
	} catch (err) {
		console.warn('[Push] VAPID setup failed:', err);
		return false;
	}
}

/**
 * Send a web push notification to a single subscription.
 * Returns true if sent, false if failed (e.g. expired subscription or VAPID not configured).
 */
export async function sendPush(
	subscription: webpush.PushSubscription,
	payload: PushPayload,
): Promise<boolean> {
	if (!ensureVapid()) {
		console.log('[Push stub] Would send:', payload.title, '-', payload.body);
		return false;
	}

	try {
		await webpush.sendNotification(
			subscription,
			JSON.stringify(payload),
			{ TTL: 60 * 60 }, // 1 hour
		);
		return true;
	} catch (err) {
		const statusCode = (err as { statusCode?: number }).statusCode;
		if (statusCode === 410 || statusCode === 404) {
			// Subscription expired / invalid
			console.warn('[Push] Subscription expired:', statusCode);
		} else {
			console.error('[Push] Send failed:', err);
		}
		return false;
	}
}
