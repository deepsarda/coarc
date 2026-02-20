'use client';

import { motion } from 'framer-motion';
import { Bookmark, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { SharedProblem } from './types';
import { timeAgo } from './types';

interface BookmarkItem {
	id: number;
	list_type: string;
	solved: boolean;
	created_at: string;
	shared_problems: SharedProblem | null;
}

export function BookmarksTab() {
	const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchBookmarks = useCallback(async () => {
		try {
			const res = await fetch('/api/problems/bookmarks');
			if (!res.ok) return;
			const data = await res.json();
			setBookmarks(data.bookmarks ?? []);
		} catch (err) {
			console.error('[BookmarksTab] Failed to fetch bookmarks:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchBookmarks();
	}, [fetchBookmarks]);

	const removeBookmark = async (problemId: number) => {
		setBookmarks((prev) => prev.filter((b) => b.shared_problems?.id !== problemId));
		try {
			await fetch('/api/problems/bookmarks', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ problem_id: problemId }),
			});
		} catch {
			await fetchBookmarks();
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="w-8 h-8 border-2 border-neon-purple/20 border-t-neon-purple animate-spin" />
			</div>
		);
	}

	const validBookmarks = bookmarks.filter((b) => b.shared_problems);

	if (validBookmarks.length === 0) {
		return (
			<div className="py-16 text-center">
				<Bookmark className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
				<p className="font-mono text-sm text-text-muted">No bookmarked problems</p>
				<p className="font-mono text-tiny text-text-muted mt-1">
					Bookmark problems from the feed to save them here
				</p>
			</div>
		);
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
			<p className="font-mono text-tiny text-text-muted mb-2">
				{validBookmarks.length} saved problem{validBookmarks.length !== 1 && 's'}
			</p>
			{validBookmarks.map((b) => {
				const p = b.shared_problems!;
				return (
					<div key={b.id} className="border border-border-hard p-4">
						<div className="flex items-center gap-2 mb-2">
							<span
								className={`px-1.5 py-0.5 font-mono text-[10px] font-black uppercase ${
									p.platform === 'cf'
										? 'bg-neon-cyan/10 text-neon-cyan'
										: 'bg-neon-orange/10 text-neon-orange'
								}`}
							>
								{p.platform.toUpperCase()}
							</span>
							{p.difficulty && (
								<span className="font-mono text-tiny text-neon-cyan font-bold">{p.difficulty}</span>
							)}
							<span className="font-mono text-tiny text-text-muted ml-auto">
								{timeAgo(b.created_at)}
							</span>
						</div>

						<a
							href={p.problem_url}
							target="_blank"
							rel="noopener noreferrer"
							className="font-mono text-sm font-bold text-text-primary hover:text-neon-cyan transition-colors inline-flex items-center gap-1 mb-1"
						>
							{p.problem_title}
							<ExternalLink className="w-3 h-3 opacity-50" />
						</a>

						{p.tags.length > 0 && (
							<div className="flex flex-wrap gap-1 mb-2">
								{p.tags.map((tag) => (
									<span
										key={tag}
										className="font-mono text-[10px] text-text-muted bg-elevated px-1.5 py-0.5"
									>
										{tag}
									</span>
								))}
							</div>
						)}

						{p.note && (
							<p className="font-mono text-sm text-text-secondary mb-2 italic">
								&ldquo;{p.note}&rdquo;
							</p>
						)}

						<div className="flex items-center gap-3 mt-2">
							<a
								href={p.problem_url}
								target="_blank"
								rel="noopener noreferrer"
								className="px-3 py-1 border border-neon-cyan/30 font-mono text-tiny font-bold text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
							>
								Solve ↗
							</a>
							<button
								type="button"
								onClick={() => removeBookmark(p.id)}
								className="ml-auto flex items-center gap-1 px-2 py-1 font-mono text-tiny text-text-muted hover:text-neon-red transition-colors"
							>
								<Bookmark className="w-3.5 h-3.5" fill="currentColor" /> Remove
							</button>
						</div>
					</div>
				);
			})}
		</motion.div>
	);
}
