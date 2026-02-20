'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Info, Megaphone, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* Types */

interface Announcement {
	id: number;
	title: string;
	body: string;
	priority: 'normal' | 'important' | 'urgent';
	created_at: string;
	profiles?: { display_name: string } | null;
}

/* Priority config */

const PRIORITY = {
	urgent: {
		border: 'border-neon-red/60',
		bg: 'bg-neon-red/5',
		glow: 'shadow-[0_0_20px_rgba(255,0,64,0.15)]',
		badge: 'bg-neon-red/20 text-neon-red',
		icon: <Zap className="w-3.5 h-3.5" />,
		label: 'URGENT',
	},
	important: {
		border: 'border-neon-orange/50',
		bg: 'bg-neon-orange/3',
		glow: '',
		badge: 'bg-neon-orange/20 text-neon-orange',
		icon: <AlertTriangle className="w-3.5 h-3.5" />,
		label: 'IMPORTANT',
	},
	normal: {
		border: 'border-border-hard',
		bg: '',
		glow: '',
		badge: 'bg-elevated text-text-muted',
		icon: <Info className="w-3.5 h-3.5" />,
		label: 'INFO',
	},
};

/* Markdown component overrides */

const mdComponents: Components = {
	h1: ({ children }) => (
		<h3 className="text-lg font-black text-text-primary mt-3 mb-1.5 tracking-tight">{children}</h3>
	),
	h2: ({ children }) => <h4 className="font-bold text-text-primary mt-2.5 mb-1">{children}</h4>,
	h3: ({ children }) => (
		<h5 className="text-sm font-bold text-text-primary mt-2 mb-1">{children}</h5>
	),
	p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
	strong: ({ children }) => <strong className="font-black text-text-primary">{children}</strong>,
	em: ({ children }) => <em className="text-text-secondary italic">{children}</em>,
	a: ({ href, children }) => (
		<a
			href={href ?? '#'}
			target="_blank"
			rel="noopener noreferrer"
			className="text-neon-cyan underline underline-offset-2 decoration-neon-cyan/40 hover:decoration-neon-cyan transition-colors"
		>
			{children}
		</a>
	),
	code: ({ children, className }) => {
		if (className?.includes('language-')) {
			return (
				<pre className="bg-void border border-border-hard p-3 my-2 overflow-x-auto">
					<code className="text-neon-cyan text-xs font-mono">{children}</code>
				</pre>
			);
		}
		return (
			<code className="bg-elevated/80 text-neon-cyan px-1.5 py-0.5 text-xs border border-border-hard/40 font-mono">
				{children}
			</code>
		);
	},
	ul: ({ children }) => (
		<ul className="list-disc pl-5 mb-2 space-y-0.5 marker:text-text-muted/40">{children}</ul>
	),
	ol: ({ children }) => (
		<ol className="list-decimal pl-5 mb-2 space-y-0.5 marker:text-text-muted/40">{children}</ol>
	),
	li: ({ children }) => <li className="text-text-secondary leading-relaxed">{children}</li>,
	blockquote: ({ children }) => (
		<blockquote className="border-l-2 border-neon-cyan/30 pl-3 my-2 text-text-muted">
			{children}
		</blockquote>
	),
	hr: () => <hr className="border-border-hard/30 my-3" />,
	table: ({ children }) => (
		<div className="overflow-x-auto my-2">
			<table className="w-full border border-border-hard text-xs">{children}</table>
		</div>
	),
	th: ({ children }) => (
		<th className="border border-border-hard px-2 py-1 bg-elevated/50 text-text-primary text-left font-bold">
			{children}
		</th>
	),
	td: ({ children }) => (
		<td className="border border-border-hard px-2 py-1 text-text-secondary">{children}</td>
	),
};

function timeAgo(date: string): string {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* Page */

export default function AnnouncementsPage() {
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const fetchAnnouncements = useCallback(async (pageNum: number, append = false) => {
		if (append) setLoadingMore(true);
		else setLoading(true);
		try {
			const res = await fetch(`/api/announcements/list?page=${pageNum}`);
			if (!res.ok) return;
			const data = await res.json();
			if (append) {
				setAnnouncements((prev) => [...prev, ...(data.announcements ?? [])]);
			} else {
				setAnnouncements(data.announcements ?? []);
			}
			setHasMore(data.has_more ?? false);
		} catch (err) {
			console.error('[Announcements] Failed to fetch announcements:', err);
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	}, []);

	useEffect(() => {
		fetchAnnouncements(1);
	}, [fetchAnnouncements]);

	const loadMore = () => {
		const next = page + 1;
		setPage(next);
		fetchAnnouncements(next, true);
	};

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[800px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-orange/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-orange pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-orange">::</span> Announcements
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Updates from the admins
				</p>
			</motion.header>

			{/* CONTENT */}
			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="w-8 h-8 border-2 border-neon-orange/20 border-t-neon-orange animate-spin" />
				</div>
			) : announcements.length === 0 ? (
				<div className="py-20 text-center">
					<Megaphone className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
					<p className="font-mono text-sm text-text-muted">No announcements yet</p>
				</div>
			) : (
				<div className="space-y-4">
					{announcements.map((a, idx) => {
						const p = PRIORITY[a.priority] ?? PRIORITY.normal;
						return (
							<motion.article
								key={a.id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.04 }}
								className={`border ${p.border} ${p.bg} ${p.glow} p-5 sm:p-6 transition-colors`}
							>
								{/* Meta row */}
								<div className="flex items-center gap-2 mb-3">
									<span
										className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest ${p.badge}`}
									>
										{p.icon} {p.label}
									</span>
									<span className="font-mono text-tiny text-text-muted">
										{timeAgo(a.created_at)}
									</span>
									{a.profiles?.display_name && (
										<span className="font-mono text-tiny text-text-muted ml-auto">
											by {a.profiles.display_name}
										</span>
									)}
								</div>

								{/* Title */}
								<h2 className="font-heading text-lg font-black text-text-primary mb-2 tracking-tight">
									{a.title}
								</h2>

								{/* Body - Rich Markdown */}
								<div className="font-mono text-sm text-text-secondary">
									<ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
										{a.body}
									</ReactMarkdown>
								</div>
							</motion.article>
						);
					})}

					{/* Load more */}
					{hasMore && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-center pt-4"
						>
							<button
								type="button"
								onClick={loadMore}
								disabled={loadingMore}
								className="btn-brutal px-6 py-2 font-mono text-sm"
							>
								{loadingMore ? 'Loading...' : 'Load More'}
							</button>
						</motion.div>
					)}
				</div>
			)}
		</div>
	);
}
