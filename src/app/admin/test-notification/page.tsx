'use client';

import { motion } from 'framer-motion';
import { Bell, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface UserInfo {
	id: string;
	display_name: string;
	push_subscription: unknown;
}

export default function AdminTestNotificationPage() {
	const [users, setUsers] = useState<UserInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [targetUserId, setTargetUserId] = useState('');
	const [title, setTitle] = useState('CO.ARC Test');
	const [body, setBody] = useState('This is a test notification 🎯');
	const [sending, setSending] = useState(false);
	const [result, setResult] = useState<string | null>(null);

	const fetchUsers = useCallback(async () => {
		try {
			const res = await fetch('/api/users/leaderboard?board=xp&limit=100');
			if (!res.ok) return;
			const data = await res.json();
			setUsers(data.leaderboard ?? []);
		} catch (err) {
			console.error('[AdminTestNotif] Failed to send test notification:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const sendNotification = async () => {
		setSending(true);
		setResult(null);
		try {
			const res = await fetch('/api/admin/test-notification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: targetUserId || undefined,
					title,
					body,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				setResult(
					`✓ Sent to ${data.sent}/${data.total} users${data.errors?.length ? `. Errors: ${data.errors.join(', ')}` : ''}`,
				);
			} else {
				setResult(`✗ ${data.error}`);
			}
		} catch {
			setResult('✗ Network error');
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[600px] mx-auto">
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-cyan pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-cyan">::</span> Test Notifications
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Admin · Send test push notifications
				</p>
			</motion.header>

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="border border-border-hard p-5 space-y-4"
			>
				<div>
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-1 block">
						Target User (leave blank for all)
					</span>
					<select
						value={targetUserId}
						onChange={(e) => setTargetUserId(e.target.value)}
						className="form-input w-full text-sm font-mono"
					>
						<option value="">All users with push subscriptions</option>
						{!loading &&
							users.map((u) => (
								<option key={u.id} value={u.id}>
									{u.display_name}
								</option>
							))}
					</select>
				</div>

				<div>
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-1 block">
						Title
					</span>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="form-input w-full text-sm font-mono"
						placeholder="Notification title"
					/>
				</div>

				<div>
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-1 block">
						Body
					</span>
					<textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						className="form-input w-full text-sm font-mono resize-none"
						rows={3}
						placeholder="Notification body text"
					/>
				</div>

				<button
					type="button"
					onClick={sendNotification}
					disabled={sending || !title || !body}
					className="flex items-center gap-2 px-4 py-2.5 bg-neon-cyan/10 border border-neon-cyan/30 font-mono text-tiny font-bold text-neon-cyan hover:bg-neon-cyan/15 transition-colors disabled:opacity-50 w-full justify-center"
				>
					{sending ? (
						<div className="w-3.5 h-3.5 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
					) : (
						<Send className="w-3.5 h-3.5" />
					)}
					{sending ? 'Sending...' : 'Send Test Notification'}
				</button>

				{result && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className={`p-3 font-mono text-sm ${
							result.startsWith('✓')
								? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
								: 'bg-neon-red/10 border border-neon-red/30 text-neon-red'
						}`}
					>
						{result}
					</motion.div>
				)}
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className="mt-6 border border-border-hard p-4"
			>
				<div className="flex items-center gap-2 mb-3">
					<Bell className="w-4 h-4 text-text-muted" />
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold">
						Info
					</span>
				</div>
				<ul className="font-mono text-tiny text-text-muted space-y-1 list-disc list-inside">
					<li>Only users with push subscriptions will receive notifications</li>
					<li>Users must have enabled notifications in their browser</li>
					<li>Notifications are sent via Web Push (VAPID)</li>
				</ul>
			</motion.div>
		</div>
	);
}
