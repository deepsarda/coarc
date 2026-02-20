'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Share, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';

type PromptState = 'hidden' | 'notification' | 'install';

/* IndexedDB helpers */

const IDB_NAME = 'coarc-push';
const IDB_STORE = 'meta';

function openIDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(IDB_NAME, 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore(IDB_STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

async function getStoredEndpoint(): Promise<string | null> {
	try {
		const db = await openIDB();
		return new Promise((resolve) => {
			const tx = db.transaction(IDB_STORE, 'readonly');
			const req = tx.objectStore(IDB_STORE).get('endpoint');
			req.onsuccess = () => resolve((req.result as string) ?? null);
			req.onerror = () => resolve(null);
		});
	} catch {
		return null;
	}
}

async function setStoredEndpoint(endpoint: string): Promise<void> {
	try {
		const db = await openIDB();
		const tx = db.transaction(IDB_STORE, 'readwrite');
		tx.objectStore(IDB_STORE).put(endpoint, 'endpoint');
	} catch {
		/* silent */
	}
}

/* VAPID key conversion */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

/**
 * Handles:
 * - Service worker registration
 * - Notification permission request with explanation popup
 * - Push subscription save to DB (with IndexedDB endpoint diffing)
 * - "Add to Homescreen" prompt on mobile
 */
export function NotificationPrompt() {
	const { profile } = useAuthContext();
	const [promptState, setPromptState] = useState<PromptState>('hidden');
	const [dismissed, setDismissed] = useState(false);
	const [deferredInstall, setDeferredInstall] = useState<BeforeInstallPromptEvent | null>(null);

	// Register service worker on mount
	useEffect(() => {
		if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
		navigator.serviceWorker.register('/sw.js').catch((err) => {
			console.warn('[SW] Registration failed:', err);
		});
	}, []);

	// Capture beforeinstallprompt for A2HS
	useEffect(() => {
		const handler = (e: Event) => {
			setDeferredInstall(e as BeforeInstallPromptEvent);
		};
		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	}, []);

	// Auto-sync subscription if permission is already granted but endpoint differs
	useEffect(() => {
		if (!profile || typeof window === 'undefined') return;
		if (!('Notification' in window) || Notification.permission !== 'granted') return;
		if (!('serviceWorker' in navigator)) return;

		const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
		if (!vapidKey) return;

		// Check if we need to update the server
		(async () => {
			try {
				const reg = await navigator.serviceWorker.ready;
				let sub = await reg.pushManager.getSubscription();

				// If permission granted but no subscription yet, create one
				if (!sub) {
					sub = await reg.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
					});
				}

				const storedEndpoint = await getStoredEndpoint();
				if (storedEndpoint === sub.endpoint) return; // Already synced

				// Endpoint new or changed update server
				const res = await fetch('/api/notifications/push/subscribe', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ subscription: sub.toJSON() }),
				});
				if (res.ok) {
					await setStoredEndpoint(sub.endpoint);
					console.log('[Push] Subscription saved to DB');
				}
			} catch (err) {
				console.error('[Push] Auto-sync error:', err);
			}
		})();
	}, [profile]);

	// Determine what to show
	useEffect(() => {
		if (!profile || dismissed) return;

		// Check if already dismissed this session
		const sessionDismissed = sessionStorage.getItem('notif-prompt-dismissed');
		if (sessionDismissed) return;

		// Check notification state
		if (typeof window === 'undefined' || !('Notification' in window)) return;

		if (Notification.permission === 'granted') {
			// Already granted, auto-sync handles DB update, nothing to prompt
			return;
		}

		if (Notification.permission === 'denied') return; // Can't re-ask

		// Check if on mobile and not installed as PWA
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as unknown as { standalone?: boolean }).standalone === true;
		const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

		if (isMobile && !isStandalone && !deferredInstall) {
			setPromptState('install');
		} else {
			setPromptState('notification');
		}
	}, [profile, dismissed, deferredInstall]);

	const subscribeToPush = useCallback(async () => {
		try {
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				setPromptState('hidden');
				return;
			}

			const registration = await navigator.serviceWorker.ready;
			const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

			if (!vapidKey) {
				console.warn('[Push] No VAPID public key configured');
				setPromptState('hidden');
				return;
			}

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
			});

			// Save to DB
			await fetch('/api/notifications/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subscription: subscription.toJSON() }),
			});

			// Store endpoint in IndexedDB for future diffing
			await setStoredEndpoint(subscription.endpoint);

			setPromptState('hidden');
		} catch (err) {
			console.error('[Push] Subscribe error:', err);
			setPromptState('hidden');
		}
	}, []);

	const handleInstallClick = async () => {
		if (deferredInstall) {
			await deferredInstall.prompt();
			setDeferredInstall(null);
		}
		setPromptState('hidden');
	};

	const dismiss = () => {
		setDismissed(true);
		setPromptState('hidden');
		sessionStorage.setItem('notif-prompt-dismissed', '1');
	};

	if (promptState === 'hidden') return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 50 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 50 }}
				className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50"
			>
				<div className="bg-elevated border border-border-hard p-4 shadow-lg shadow-black/40 relative">
					<button
						type="button"
						onClick={dismiss}
						className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
					>
						<X className="w-4 h-4" />
					</button>

					{promptState === 'notification' ? (
						<>
							<div className="flex items-center gap-2 mb-2">
								<Bell className="w-5 h-5 text-neon-cyan" />
								<h3 className="font-mono text-sm font-bold text-text-primary">
									Enable Notifications
								</h3>
							</div>
							<p className="font-mono text-tiny text-text-muted mb-3 leading-relaxed">
								Get notified about attendance reminders, duel challenges, daily problems, and streak
								alerts. Never miss a beat.
							</p>
							<button
								type="button"
								onClick={subscribeToPush}
								className="w-full py-2 bg-neon-cyan/10 border border-neon-cyan/30 font-mono text-tiny font-bold text-neon-cyan hover:bg-neon-cyan/15 transition-colors"
							>
								Allow Notifications
							</button>
						</>
					) : (
						<>
							<div className="flex items-center gap-2 mb-2">
								<Share className="w-5 h-5 text-neon-green" />
								<h3 className="font-mono text-sm font-bold text-text-primary">
									Add to Home Screen
								</h3>
							</div>
							<p className="font-mono text-tiny text-text-muted mb-3 leading-relaxed">
								Install CO.ARC as an app for the best experience. Giving you instant access,
								notifications, and offline support.
							</p>
							{deferredInstall ? (
								<button
									type="button"
									onClick={handleInstallClick}
									className="w-full py-2 bg-neon-green/10 border border-neon-green/30 font-mono text-tiny font-bold text-neon-green hover:bg-neon-green/15 transition-colors"
								>
									Install App
								</button>
							) : (
								<p className="font-mono text-tiny text-text-dim">
									Tap{' '}
									<span className="text-text-secondary">
										Share → &quot;Add to Home Screen&quot;
									</span>{' '}
									in your browser
								</p>
							)}
						</>
					)}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}

// Type augment for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
