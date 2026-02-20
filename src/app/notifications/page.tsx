'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BellOff, Check, CheckCheck, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { NOTIFICATION_LABELS } from '@/lib/utils/constants';
import type { Notification } from '@/types/gamification';

/* Types */

type FilterType = 'all' | 'unread' | string;

interface NotifResponse {
	notifications: Notification[];
	page: number;
	total: number;
	unread_count: number;
	has_more: boolean;
}

const TYPE_FILTERS: { key: string; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'unread', label: 'Unread' },
	{ key: 'duel_challenge', label: 'Duels' },
	{ key: 'duel_result', label: 'Results' },
	{ key: 'boss_new', label: 'Boss' },
	{ key: 'badge_earned', label: 'Badges' },
	{ key: 'streak_warning', label: 'Streak' },
	{ key: 'overtake', label: 'Rank' },
	{ key: 'announcement', label: 'News' },
];

/* Helpers */

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return 'Just now';
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	if (days < 7) return `${days}d ago`;
	const weeks = Math.floor(days / 7);
	if (weeks < 4) return `${weeks}w ago`;
	return new Date(dateStr).toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'short',
	});
}

function getNotifMeta(type: string) {
	return NOTIFICATION_LABELS[type] ?? { icon: '📌', color: 'neon-cyan' };
}

/* Page */

export default function NotificationsPage() {
	const { loading: authLoading } = useAuthContext();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [filter, setFilter] = useState<FilterType>('all');
	const [markingAll, setMarkingAll] = useState(false);

	/* Fetch notifications */
	const fetchNotifications = useCallback(
		async (pageNum: number, append = false) => {
			if (pageNum === 1 && !append) setLoading(true);
			else setLoadingMore(true);

			try {
				const params = new URLSearchParams({
					page: String(pageNum),
				});
				if (filter === 'unread') {
					params.set('unread_only', 'true');
				}

				const res = await fetch(`/api/notifications/list?${params}`);
				if (!res.ok) return;
				const data: NotifResponse = await res.json();

				let filtered = data.notifications;
				if (filter !== 'all' && filter !== 'unread') {
					// Client-side type filter
					filtered = filtered.filter((n) => n.type === filter);
				}

				if (append) {
					setNotifications((prev) => [...prev, ...filtered]);
				} else {
					setNotifications(filtered);
				}
				setUnreadCount(data.unread_count);
				setHasMore(data.has_more);
				setTotal(data.total);
			} catch (err) {
				console.error('[Notifications] Failed to mark notification as read:', err);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[filter],
	);

	useEffect(() => {
		setPage(1);
		fetchNotifications(1);
	}, [fetchNotifications]);

	/* Mark single as read */
	const markRead = useCallback(
		async (id: number) => {
			// Optimistic update
			setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
			setUnreadCount((c) => Math.max(0, c - 1));

			try {
				await fetch('/api/notifications/read', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ ids: [id] }),
				});
			} catch {
				// Revert on failure
				fetchNotifications(1);
			}
		},
		[fetchNotifications],
	);

	/* Mark all as read */
	const markAllRead = useCallback(async () => {
		setMarkingAll(true);
		try {
			await fetch('/api/notifications/read', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ all: true }),
			});
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
			setUnreadCount(0);
		} catch (err) {
			console.error('[Notifications] Failed to fetch notifications:', err);
		} finally {
			setMarkingAll(false);
		}
	}, []);

	/* Load more */
	const loadMore = useCallback(() => {
		const next = page + 1;
		setPage(next);
		fetchNotifications(next, true);
	}, [page, fetchNotifications]);

	/* Loading */
	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[800px] mx-auto relative">
			{/* Background glow */}
			<div className="absolute top-0 right-0 w-[400px] h-[300px] bg-neon-purple/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="flex items-end justify-between border-l-2 border-neon-purple pl-6 mb-8"
			>
				<div>
					<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
						<span className="text-neon-purple">::</span> Notifications
					</h1>
					<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
						{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
					</p>
				</div>

				{/* Mark all read */}
				{unreadCount > 0 && (
					<button
						type="button"
						onClick={markAllRead}
						disabled={markingAll}
						className="flex items-center gap-1.5 px-3 py-1.5 border border-border-hard bg-zinc-950 hover:border-neon-cyan/50 transition-colors font-mono text-tiny uppercase tracking-widest font-black disabled:opacity-30"
					>
						<CheckCheck className="w-3 h-3" />
						{markingAll ? 'Marking...' : 'Mark All Read'}
					</button>
				)}
			</motion.header>

			{/* FILTER BAR */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="flex flex-wrap gap-1.5 mb-6"
			>
				{TYPE_FILTERS.map((f) => (
					<button
						key={f.key}
						type="button"
						onClick={() => setFilter(f.key)}
						className={`px-3 py-1.5 font-mono text-tiny font-bold uppercase tracking-widest border transition-all ${
							filter === f.key
								? 'border-neon-purple bg-neon-purple/10 text-neon-purple'
								: 'border-border-hard text-text-muted hover:text-text-secondary hover:border-text-muted'
						}`}
					>
						{f.label}
					</button>
				))}
			</motion.div>

			{/* NOTIFICATION LIST */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.15 }}
				className="space-y-1"
			>
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<div className="w-8 h-8 border-2 border-neon-purple/20 border-t-neon-purple animate-spin" />
					</div>
				) : notifications.length > 0 ? (
					<AnimatePresence mode="popLayout">
						{notifications.map((notif, idx) => {
							const meta = getNotifMeta(notif.type);
							return (
								<motion.button
									key={notif.id}
									type="button"
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 10 }}
									transition={{ delay: idx * 0.02, duration: 0.25 }}
									onClick={() => {
										if (!notif.read) markRead(notif.id);
									}}
									className={`w-full text-left flex items-start gap-4 px-4 py-3.5 border transition-colors dash-row-hover group ${
										notif.read
											? 'border-transparent'
											: 'border-l-2 border-l-neon-purple bg-neon-purple/3 border-t-transparent border-r-transparent border-b-transparent'
									}`}
								>
									{/* Icon */}
									<div className="shrink-0 mt-0.5 text-lg leading-none">{meta.icon}</div>

									{/* Content */}
									<div className="flex-1 min-w-0">
										<p
											className={`font-mono text-sm font-bold leading-snug ${notif.read ? 'text-text-secondary' : 'text-text-primary'}`}
										>
											{notif.title}
										</p>
										<p
											className={`font-mono text-tiny mt-1 leading-relaxed ${notif.read ? 'text-text-muted' : 'text-text-secondary'}`}
										>
											{notif.body}
										</p>
										<p className="font-mono text-tiny text-text-muted mt-1.5 uppercase tracking-widest">
											{timeAgo(notif.created_at)}
										</p>
									</div>

									{/* Read indicator */}
									<div className="shrink-0 mt-1">
										{notif.read ? (
											<Check className="w-3.5 h-3.5 text-text-muted/30" />
										) : (
											<div className="w-2 h-2 bg-neon-purple rounded-full shadow-[0_0_6px_rgba(180,74,255,0.5)]" />
										)}
									</div>
								</motion.button>
							);
						})}
					</AnimatePresence>
				) : (
					<div className="py-20 text-center">
						<BellOff className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
						<p className="font-mono text-sm text-text-muted">
							{filter === 'unread'
								? 'No unread notifications'
								: filter !== 'all'
									? `No ${filter.replace('_', ' ')} notifications`
									: 'No notifications yet'}
						</p>
						<p className="font-mono text-tiny text-text-dim mt-1">
							Notifications will appear here as you use the platform
						</p>
					</div>
				)}

				{/* Load more */}
				{hasMore && !loading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="pt-4 text-center"
					>
						<button
							type="button"
							onClick={loadMore}
							disabled={loadingMore}
							className="inline-flex items-center gap-2 px-4 py-2 border border-border-hard font-mono text-tiny uppercase tracking-widest font-bold text-text-muted hover:text-text-primary hover:border-neon-purple/50 transition-colors disabled:opacity-30"
						>
							{loadingMore ? (
								<div className="w-3 h-3 border border-neon-purple/30 border-t-neon-purple animate-spin" />
							) : (
								<ChevronDown className="w-3 h-3" />
							)}
							Load More
						</button>
					</motion.div>
				)}
			</motion.div>

			{/* TOTAL */}
			{!loading && total > 0 && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="text-center font-mono text-tiny text-text-muted uppercase tracking-widest mt-6"
				>
					{total} total notification{total !== 1 && 's'}
				</motion.p>
			)}
		</div>
	);
}
