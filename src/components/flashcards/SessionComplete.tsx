'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';

export interface SessionStats {
	cardsReviewed: number;
	gotIt: number;
	needsReview: number;
	startTime: number;
	xpEarned: number;
}

interface SessionCompleteProps {
	deckTitle: string;
	stats: SessionStats;
	masteredCount: number;
	totalCards: number;
	onReviewAgain: () => void;
}

export function SessionComplete({
	deckTitle,
	stats,
	masteredCount,
	totalCards,
	onReviewAgain,
}: SessionCompleteProps) {
	const elapsed = Math.round((Date.now() - stats.startTime) / 1000);
	const mins = Math.floor(elapsed / 60);
	const secs = elapsed % 60;
	const accuracy =
		stats.cardsReviewed > 0 ? Math.round((stats.gotIt / stats.cardsReviewed) * 100) : 0;
	const progressPct = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[600px] mx-auto">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ type: 'spring', damping: 20 }}
				className="text-center"
			>
				{/* Trophy */}
				<motion.div
					initial={{ y: -20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2, type: 'spring' }}
					className="mb-6"
				>
					<div className="inline-flex items-center justify-center w-20 h-20 border-2 border-neon-green/40 bg-neon-green/5">
						<Trophy className="w-10 h-10 text-neon-green" />
					</div>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter mb-1"
				>
					Session Complete!
				</motion.h1>
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="text-text-muted font-mono text-sm mb-8"
				>
					{deckTitle}
				</motion.p>

				{/* STATS GRID */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="card-brutal p-0 overflow-hidden mb-6"
				>
					<div className="terminal-bar">
						<div className="flex items-center gap-3">
							<div className="traffic-lights">
								<div className="status-dot status-dot-green" />
								<div className="status-dot status-dot-cyan" />
								<div className="status-dot status-dot-green" />
							</div>
							<span className="scifi-label">:: Session Stats</span>
						</div>
					</div>

					<div className="grid grid-cols-2 divide-x divide-border-hard">
						<div className="p-5 text-center">
							<p className="font-mono text-3xl font-black text-neon-cyan tracking-tighter">
								{stats.cardsReviewed}
							</p>
							<p className="dash-sub mt-1">Cards Reviewed</p>
						</div>
						<div className="p-5 text-center">
							<p
								className={`font-mono text-3xl font-black tracking-tighter ${accuracy >= 80 ? 'text-neon-green' : accuracy >= 50 ? 'text-neon-orange' : 'text-neon-red'}`}
							>
								{accuracy}%
							</p>
							<p className="dash-sub mt-1">Accuracy</p>
						</div>
					</div>

					<div className="border-t border-border-hard grid grid-cols-3 divide-x divide-border-hard">
						<div className="p-4 text-center">
							<p className="font-mono text-xl font-black text-neon-green">{stats.gotIt}</p>
							<p className="dash-sub mt-0.5">Got It</p>
						</div>
						<div className="p-4 text-center">
							<p className="font-mono text-xl font-black text-neon-orange">{stats.needsReview}</p>
							<p className="dash-sub mt-0.5">Review</p>
						</div>
						<div className="p-4 text-center">
							<p className="font-mono text-xl font-black text-text-primary">
								{mins}:{String(secs).padStart(2, '0')}
							</p>
							<p className="dash-sub mt-0.5">Time</p>
						</div>
					</div>

					{stats.xpEarned > 0 && (
						<div className="border-t border-border-hard p-4 flex items-center justify-center gap-2">
							<Zap className="w-4 h-4 text-neon-yellow" />
							<span className="font-mono text-sm font-bold text-neon-yellow">
								+{stats.xpEarned} XP earned
							</span>
						</div>
					)}
				</motion.div>

				{/* Deck Progress */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.7 }}
					className="mb-8"
				>
					<div className="flex items-center justify-between mb-1.5">
						<span className="dash-sub">Deck Mastery</span>
						<span
							className={`font-mono text-tiny font-bold ${progressPct === 100 ? 'text-neon-green' : 'text-neon-cyan'}`}
						>
							{masteredCount}/{totalCards} ({progressPct}%)
						</span>
					</div>
					<div className="h-2 bg-void rounded-full overflow-hidden">
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${progressPct}%` }}
							transition={{ duration: 1, delay: 0.8 }}
							className={`h-full ${progressPct === 100 ? 'bg-neon-green' : 'bg-neon-cyan'}`}
						/>
					</div>
					{progressPct === 100 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 1.5 }}
							className="flex items-center justify-center gap-2 mt-3"
						>
							<Sparkles className="w-4 h-4 text-neon-green" />
							<span className="font-mono text-sm text-neon-green font-bold">
								Deck fully mastered!
							</span>
						</motion.div>
					)}
				</motion.div>

				{/* Actions */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.9 }}
					className="flex flex-col sm:flex-row gap-3 justify-center"
				>
					<button
						type="button"
						onClick={onReviewAgain}
						className="btn-brutal px-6 py-3 flex items-center justify-center gap-2"
					>
						<RotateCcw className="w-4 h-4" /> Review Again
					</button>
					<Link
						href="/flashcards"
						className="btn-neon px-6 py-3 flex items-center justify-center gap-2"
					>
						<ArrowLeft className="w-4 h-4" /> All Decks
					</Link>
				</motion.div>
			</motion.div>
		</div>
	);
}
