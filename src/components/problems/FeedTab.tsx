'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Code, ExternalLink, Plus, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { SharedProblem } from './types';
import { REACTIONS, timeAgo } from './types';

export function FeedTab() {
	const [problems, setProblems] = useState<SharedProblem[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [showShare, setShowShare] = useState(false);
	const [shareForm, setShareForm] = useState({
		platform: 'cf',
		problem_url: '',
		problem_title: '',
		note: '',
	});
	const [sharing, setSharing] = useState(false);

	const fetchFeed = useCallback(async (pageNum: number, append = false) => {
		if (!append) setLoading(true);
		try {
			const res = await fetch(`/api/problems/feed?page=${pageNum}`);
			if (!res.ok) return;
			const data = await res.json();
			if (append) {
				setProblems((prev) => [...prev, ...(data.problems ?? [])]);
			} else {
				setProblems(data.problems ?? []);
			}
			setHasMore(data.has_more ?? false);
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchFeed(1);
	}, [fetchFeed]);

	const toggleReaction = async (problemId: number, reaction: string) => {
		setProblems((prev) =>
			prev.map((p) => {
				if (p.id !== problemId) return p;
				const counts = { ...p.reaction_counts };
				if (p.user_reaction === reaction) {
					counts[reaction] = Math.max(0, (counts[reaction] ?? 1) - 1);
					return { ...p, user_reaction: null, reaction_counts: counts };
				}
				if (p.user_reaction) {
					counts[p.user_reaction] = Math.max(0, (counts[p.user_reaction] ?? 1) - 1);
				}
				counts[reaction] = (counts[reaction] ?? 0) + 1;
				return { ...p, user_reaction: reaction, reaction_counts: counts };
			}),
		);
		try {
			await fetch(`/api/problems/${problemId}/react`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reaction }),
			});
		} catch {
			await fetchFeed(1);
		}
	};

	const toggleBookmark = async (problemId: number) => {
		const problem = problems.find((p) => p.id === problemId);
		if (!problem) return;
		setProblems((prev) =>
			prev.map((p) => (p.id === problemId ? { ...p, user_bookmarked: !p.user_bookmarked } : p)),
		);
		try {
			if (problem.user_bookmarked) {
				await fetch('/api/problems/bookmarks', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ problem_id: problemId }),
				});
			} else {
				await fetch('/api/problems/bookmarks', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ problem_id: problemId, list_type: 'want_to_solve' }),
				});
			}
		} catch {
			await fetchFeed(1);
		}
	};

	const handleShare = async () => {
		if (!shareForm.problem_url.trim() || !shareForm.problem_title.trim()) return;
		setSharing(true);
		try {
			await fetch('/api/problems/share', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					platform: shareForm.platform,
					problem_url: shareForm.problem_url,
					problem_title: shareForm.problem_title,
					note: shareForm.note || null,
				}),
			});
			setShareForm({ platform: 'cf', problem_url: '', problem_title: '', note: '' });
			setShowShare(false);
			await fetchFeed(1);
		} catch {
			/* silent */
		} finally {
			setSharing(false);
		}
	};

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
			{/* Share button */}
			<div className="mb-4">
				<button
					type="button"
					onClick={() => setShowShare(!showShare)}
					className="flex items-center gap-1.5 px-4 py-2 border border-neon-purple/30 font-mono text-tiny font-bold text-neon-purple hover:bg-neon-purple/5 transition-colors"
				>
					<Plus className="w-3.5 h-3.5" /> Share Problem
				</button>
			</div>

			{/* Share form */}
			<AnimatePresence>
				{showShare && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="mb-4 border border-border-hard p-4 overflow-hidden"
					>
						<div className="space-y-3">
							<div className="flex gap-2">
								<select
									value={shareForm.platform}
									onChange={(e) => setShareForm({ ...shareForm, platform: e.target.value })}
									className="form-input w-24 text-sm font-mono"
								>
									<option value="cf">CF</option>
									<option value="lc">LC</option>
								</select>
								<input
									type="text"
									placeholder="Problem title"
									value={shareForm.problem_title}
									onChange={(e) => setShareForm({ ...shareForm, problem_title: e.target.value })}
									className="form-input flex-1 text-sm font-mono"
								/>
							</div>
							<input
								type="url"
								placeholder="Problem URL"
								value={shareForm.problem_url}
								onChange={(e) => setShareForm({ ...shareForm, problem_url: e.target.value })}
								className="form-input w-full text-sm font-mono"
							/>
							<input
								type="text"
								placeholder="Note (optional)"
								value={shareForm.note}
								onChange={(e) => setShareForm({ ...shareForm, note: e.target.value })}
								className="form-input w-full text-sm font-mono"
							/>
							<div className="flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setShowShare(false)}
									className="px-3 py-1.5 font-mono text-tiny text-text-muted"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleShare}
									disabled={sharing}
									className="flex items-center gap-1 px-4 py-1.5 bg-neon-purple/15 border border-neon-purple/30 font-mono text-tiny font-bold text-neon-purple"
								>
									<Send className="w-3 h-3" /> {sharing ? 'Sharing...' : 'Share'}
								</button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Feed list */}
			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="w-8 h-8 border-2 border-neon-purple/20 border-t-neon-purple animate-spin" />
				</div>
			) : problems.length === 0 ? (
				<div className="py-16 text-center">
					<Code className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
					<p className="font-mono text-sm text-text-muted">No problems shared yet</p>
				</div>
			) : (
				<div className="space-y-3">
					{problems.map((p) => (
						<div key={p.id} className="border border-border-hard p-4">
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
								{p.profiles && (
									<span className="font-mono text-tiny text-text-muted">
										{p.source === 'auto_lc' ? 'Auto' : p.profiles.display_name}
									</span>
								)}
								<span className="font-mono text-tiny text-text-muted ml-auto">
									{timeAgo(p.created_at)}
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

							<div className="flex items-center gap-3 mt-3">
								{REACTIONS.map((r) => {
									const count = p.reaction_counts[r.key] ?? 0;
									const isActive = p.user_reaction === r.key;
									return (
										<button
											key={r.key}
											type="button"
											onClick={() => toggleReaction(p.id, r.key)}
											className={`flex items-center gap-1 px-2 py-1 font-mono text-tiny border transition-colors ${
												isActive
													? 'border-neon-cyan/30 text-neon-cyan bg-neon-cyan/5'
													: 'border-transparent text-text-muted hover:text-text-secondary'
											}`}
										>
											{r.icon}
											{count > 0 && <span>{count}</span>}
										</button>
									);
								})}
								<button
									type="button"
									onClick={() => toggleBookmark(p.id)}
									className={`ml-auto p-1 transition-colors ${
										p.user_bookmarked
											? 'text-neon-yellow'
											: 'text-text-muted hover:text-neon-yellow'
									}`}
								>
									<Bookmark
										className="w-4 h-4"
										fill={p.user_bookmarked ? 'currentColor' : 'none'}
									/>
								</button>
							</div>
						</div>
					))}

					{hasMore && (
						<div className="text-center pt-2">
							<button
								type="button"
								onClick={() => {
									const next = page + 1;
									setPage(next);
									fetchFeed(next, true);
								}}
								className="btn-brutal px-6 py-2 font-mono text-sm"
							>
								Load More
							</button>
						</div>
					)}
				</div>
			)}
		</motion.div>
	);
}
