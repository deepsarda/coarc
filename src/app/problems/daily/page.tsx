'use client';

import { motion } from 'framer-motion';
import { Calendar, Check, ExternalLink, Loader2, RefreshCw, Target, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/* Types */
interface DailyProblem {
	id: number;
	date: string;
	problem_id: string;
	problem_name: string;
	problem_rating: number | null;
	problem_url: string;
	tags: string[];
	is_admin_curated: boolean;
}

export default function DailyProblemPage() {
	const [daily, setDaily] = useState<DailyProblem | null>(null);
	const [solvesCount, setSolvesCount] = useState(0);
	const [userSolved, setUserSolved] = useState(false);
	const [loading, setLoading] = useState(true);
	const [marking, setMarking] = useState(false);
	const [checking, setChecking] = useState(false);
	const [autoDetected, setAutoDetected] = useState(false);
	const [markError, setMarkError] = useState('');

	const fetchDaily = useCallback(async () => {
		try {
			const res = await fetch('/api/problems/daily');
			if (!res.ok) return;
			const data = await res.json();
			setDaily(data.daily ?? null);
			setSolvesCount(data.solves_count ?? 0);
			setUserSolved(data.user_solved ?? false);
			return data;
		} catch (err) {
			console.error('[DailyProblem] Failed to fetch daily problem:', err);
		}
	}, []);

	useEffect(() => {
		(async () => {
			const data = await fetchDaily();
			setLoading(false);
			// Auto-check if solved after loading (only if not already marked)
			if (data?.daily && !data.user_solved) {
				setChecking(true);
				try {
					const checkRes = await fetch(
						`/api/problems/daily/check?problem_id=${data.daily.problem_id}`,
					);
					if (checkRes.ok) {
						const checkData = await checkRes.json();
						if (checkData.solved) {
							setAutoDetected(true);
							// Auto-mark as solved
							const markRes = await fetch('/api/problems/daily', { method: 'POST' });
							if (markRes.ok) {
								setUserSolved(true);
								setSolvesCount((c) => c + 1);
							}
						}
					}
				} catch (err) {
					console.error('[DailyProblem] Failed to mark problem as solved:', err);
				} finally {
					setChecking(false);
				}
			}
		})();
	}, [fetchDaily]);

	const markSolved = async () => {
		setMarking(true);
		setMarkError('');
		try {
			const res = await fetch('/api/problems/daily', { method: 'POST' });
			if (res.ok) {
				setUserSolved(true);
				setSolvesCount((c) => c + 1);
			} else {
				const data = await res.json();
				setMarkError(data.error ?? 'Failed to mark solved');
			}
		} catch {
			setMarkError('Network error');
		} finally {
			setMarking(false);
		}
	};

	const recheckSolved = async () => {
		if (!daily) return;
		setChecking(true);
		setMarkError('');
		try {
			const checkRes = await fetch(`/api/problems/daily/check?problem_id=${daily.problem_id}`);
			if (checkRes.ok) {
				const checkData = await checkRes.json();
				if (checkData.solved) {
					const markRes = await fetch('/api/problems/daily', { method: 'POST' });
					if (markRes.ok) {
						setUserSolved(true);
						setSolvesCount((c) => c + 1);
						setAutoDetected(true);
					}
				} else {
					setMarkError('Not found in your submissions yet. Solve the problem and try again.');
				}
			}
		} catch {
			setMarkError('Check failed');
		} finally {
			setChecking(false);
		}
	};

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[700px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-cyan/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-cyan pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-cyan">::</span> Daily Problem
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					One problem every day · +25 XP bonus · Auto-detects solve
				</p>
			</motion.header>

			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
				</div>
			) : !daily ? (
				<div className="py-20 text-center">
					<Calendar className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
					<p className="font-mono text-sm text-text-muted">No daily problem set for today</p>
					<p className="font-mono text-tiny text-text-muted mt-1">Check back later!</p>
				</div>
			) : (
				<motion.div
					initial={{ opacity: 0, y: 15 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, type: 'spring', damping: 20 }}
					className="border-2 border-neon-cyan/30 p-6 sm:p-8 relative overflow-hidden"
				>
					<div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/3 blur-[80px] pointer-events-none" />

					{/* Date */}
					<div className="flex items-center gap-2 mb-4">
						<Calendar className="w-3.5 h-3.5 text-neon-cyan opacity-60" />
						<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold">
							{new Date(`${daily.date}T00:00:00`).toLocaleDateString('en-IN', {
								weekday: 'long',
								day: 'numeric',
								month: 'long',
							})}
						</span>
						{daily.is_admin_curated && (
							<span className="ml-auto px-2 py-0.5 font-mono text-[10px] font-black uppercase bg-neon-cyan/10 text-neon-cyan">
								Curated
							</span>
						)}
					</div>

					{/* Problem name */}
					<a
						href={daily.problem_url}
						target="_blank"
						rel="noopener noreferrer"
						className="font-heading text-xl sm:text-2xl font-black text-text-primary hover:text-neon-cyan transition-colors inline-flex items-center gap-2"
					>
						{daily.problem_name}
						<ExternalLink className="w-5 h-5 opacity-40" />
					</a>

					{/* Info row */}
					<div className="flex items-center gap-3 mt-3 flex-wrap">
						{daily.problem_rating && (
							<span className="font-mono text-lg font-black text-neon-cyan tabular-nums">
								{daily.problem_rating}
							</span>
						)}
						<span className="font-mono text-tiny text-text-muted uppercase bg-elevated px-2 py-0.5">
							{daily.problem_id}
						</span>
					</div>

					{/* Tags */}
					{daily.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mt-3">
							{daily.tags.map((tag) => (
								<span
									key={tag}
									className="font-mono text-[10px] text-text-muted bg-elevated px-1.5 py-0.5"
								>
									{tag}
								</span>
							))}
						</div>
					)}

					<div className="h-px bg-linear-to-r from-neon-cyan/20 via-border-hard/30 to-transparent my-5" />

					{/* Solves count */}
					<div className="flex items-center gap-2 mb-4">
						<Users className="w-4 h-4 text-text-muted opacity-50" />
						<span className="font-mono text-sm text-text-secondary">
							<span className="font-black text-text-primary">{solvesCount}</span> classmate
							{solvesCount !== 1 && 's'} solved today&apos;s problem
						</span>
					</div>

					{/* Auto-check indicator */}
					{checking && (
						<div className="flex items-center gap-2 mb-3 px-3 py-2 bg-neon-cyan/5 border border-neon-cyan/20">
							<Loader2 className="w-3.5 h-3.5 text-neon-cyan animate-spin" />
							<span className="font-mono text-tiny text-neon-cyan">
								Checking your submissions...
							</span>
						</div>
					)}

					{/* Action */}
					{userSolved ? (
						<div className="flex items-center gap-2 px-4 py-3 bg-neon-green/10 border border-neon-green/30">
							<Check className="w-4 h-4 text-neon-green" />
							<span className="font-mono text-sm font-bold text-neon-green">
								Solved! +25 XP earned
								{autoDetected && <span className="text-neon-green/60 ml-1">(auto-detected)</span>}
							</span>
						</div>
					) : (
						<div className="space-y-2">
							<div className="flex gap-3">
								<a
									href={daily.problem_url}
									target="_blank"
									rel="noopener noreferrer"
									className="flex-1 text-center px-4 py-3 bg-neon-cyan/10 border border-neon-cyan/30 font-mono text-sm font-bold text-neon-cyan hover:bg-neon-cyan/15 transition-colors"
								>
									Open Problem ↗
								</a>
								<button
									type="button"
									onClick={recheckSolved}
									disabled={checking}
									className="flex items-center gap-1.5 px-4 py-3 bg-neon-cyan/5 border border-neon-cyan/20 font-mono text-sm font-bold text-neon-cyan hover:bg-neon-cyan/10 transition-colors disabled:opacity-50"
								>
									<RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
									Check
								</button>
							</div>
							<button
								type="button"
								onClick={markSolved}
								disabled={marking}
								className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-neon-green/10 border border-neon-green/30 font-mono text-sm font-bold text-neon-green hover:bg-neon-green/15 transition-colors disabled:opacity-50"
							>
								<Target className="w-4 h-4" />
								{marking ? 'Marking...' : 'Mark Solved Manually'}
							</button>
							{markError && <p className="font-mono text-tiny text-neon-red">{markError}</p>}
						</div>
					)}
				</motion.div>
			)}
		</div>
	);
}
