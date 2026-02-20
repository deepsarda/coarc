'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

interface DeckProgress {
	got_it: number;
	needs_review: number;
	unseen: number;
}

export interface Deck {
	id: number;
	title: string;
	description: string | null;
	tags: string[];
	card_count: number;
	created_at: string;
	progress: DeckProgress;
}

export function DeckGrid({ decks }: { decks: Deck[] }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			<AnimatePresence mode="popLayout">
				{decks.map((deck, i) => (
					<DeckCard key={deck.id} deck={deck} index={i} />
				))}
			</AnimatePresence>
		</div>
	);
}

function DeckCard({ deck, index }: { deck: Deck; index: number }) {
	const total = deck.card_count;
	const mastered = deck.progress.got_it;
	const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
	const isComplete = pct === 100 && total > 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ delay: index * 0.05 }}
		>
			<Link href={`/flashcards/${deck.id}`}>
				<div
					className={`card-brutal group p-5 h-full flex flex-col transition-all cursor-pointer ${
						isComplete ? 'border-neon-green/40' : ''
					}`}
				>
					{/* Title */}
					<div className="flex items-start justify-between gap-2 mb-3">
						<h3 className="font-heading font-black text-text-primary text-lg leading-tight">
							{deck.title}
						</h3>
						{isComplete && <Sparkles className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />}
					</div>

					{/* Description */}
					{deck.description && (
						<p className="text-text-secondary text-sm font-mono mb-3 line-clamp-2">
							{deck.description}
						</p>
					)}

					{/* Tags */}
					{deck.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mb-4">
							{deck.tags.map((t) => (
								<span
									key={t}
									className="px-2 py-0.5 bg-neon-cyan/5 border border-neon-cyan/20 text-neon-cyan font-mono text-micro uppercase tracking-widest"
								>
									{t}
								</span>
							))}
						</div>
					)}

					<div className="mt-auto">
						{/* Progress Bar */}
						<div className="h-1.5 bg-void rounded-full overflow-hidden mb-2">
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${pct}%` }}
								transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
								className={`h-full ${isComplete ? 'bg-neon-green' : 'bg-neon-cyan'}`}
							/>
						</div>

						{/* Stats row */}
						<div className="flex items-center justify-between">
							<span className="font-mono text-tiny text-text-dim uppercase tracking-widest font-bold">
								{mastered}/{total} mastered
							</span>
							<span
								className={`font-mono text-tiny font-bold ${isComplete ? 'text-neon-green' : 'text-text-muted'}`}
							>
								{pct}%
							</span>
						</div>
					</div>
				</div>
			</Link>
		</motion.div>
	);
}
