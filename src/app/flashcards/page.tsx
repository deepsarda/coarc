'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Layers, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface DeckProgress {
	got_it: number;
	needs_review: number;
	unseen: number;
}

interface Deck {
	id: number;
	title: string;
	description: string | null;
	tags: string[];
	card_count: number;
	created_at: string;
	progress: DeckProgress;
}

export default function FlashcardsPage() {
	const [decks, setDecks] = useState<Deck[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [tagFilter, setTagFilter] = useState<string | null>(null);
	const [sort, setSort] = useState<'newest' | 'cards' | 'progress'>('newest');

	useEffect(() => {
		fetch('/api/flashcards/decks')
			.then((r) => r.json())
			.then((d) => setDecks(d.decks ?? []))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const allTags = useMemo(() => {
		const s = new Set<string>();
		for (const d of decks) for (const t of d.tags) s.add(t);
		return [...s].sort();
	}, [decks]);

	const filtered = useMemo(() => {
		let list = decks;
		if (search) {
			const q = search.toLowerCase();
			list = list.filter(
				(d) => d.title.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q)),
			);
		}
		if (tagFilter) {
			list = list.filter((d) => d.tags.includes(tagFilter));
		}
		if (sort === 'cards') list = [...list].sort((a, b) => b.card_count - a.card_count);
		else if (sort === 'progress')
			list = [...list].sort((a, b) => {
				const pA = a.card_count > 0 ? a.progress.got_it / a.card_count : 0;
				const pB = b.card_count > 0 ? b.progress.got_it / b.card_count : 0;
				return pB - pA;
			});
		return list;
	}, [decks, search, tagFilter, sort]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[1100px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-cyan/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-cyan pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-cyan">::</span> Flashcards
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Study · Review · Master
				</p>
			</motion.header>

			{/* CONTROLS */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="flex flex-col sm:flex-row gap-3 mb-6"
			>
				{/* Search */}
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search decks..."
						className="form-input pl-10 py-2.5 text-sm"
					/>
				</div>

				{/* Sort */}
				<select
					value={sort}
					onChange={(e) => setSort(e.target.value as typeof sort)}
					className="form-input py-2.5 text-sm sm:w-40"
				>
					<option value="newest">Newest</option>
					<option value="cards">Most Cards</option>
					<option value="progress">My Progress</option>
				</select>
			</motion.div>

			{/* TAG PILLS */}
			{allTags.length > 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.15 }}
					className="flex flex-wrap gap-2 mb-6"
				>
					<button
						type="button"
						onClick={() => setTagFilter(null)}
						className={`flex items-center gap-1 px-3 py-1 font-mono text-tiny uppercase tracking-widest font-bold border transition-colors ${
							!tagFilter
								? 'border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10'
								: 'border-border-hard text-text-muted hover:text-text-secondary'
						}`}
					>
						<Filter className="w-3 h-3" /> All
					</button>
					{allTags.map((t) => (
						<button
							type="button"
							key={t}
							onClick={() => setTagFilter(tagFilter === t ? null : t)}
							className={`px-3 py-1 font-mono text-tiny uppercase tracking-widest font-bold border transition-colors ${
								tagFilter === t
									? 'border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10'
									: 'border-border-hard text-text-muted hover:text-text-secondary'
							}`}
						>
							{t}
						</button>
					))}
				</motion.div>
			)}

			{/* DECK GRID */}
			{filtered.length === 0 ? (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
					<Layers className="w-12 h-12 text-text-dim mx-auto mb-4" />
					<p className="text-text-muted font-mono text-sm">No flashcard decks yet</p>
					<p className="text-text-dim font-mono text-tiny mt-1">
						Admins can upload decks from the admin panel
					</p>
				</motion.div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<AnimatePresence mode="popLayout">
						{filtered.map((deck, i) => {
							const total = deck.card_count;
							const mastered = deck.progress.got_it;
							const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
							const isComplete = pct === 100 && total > 0;

							return (
								<motion.div
									key={deck.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95 }}
									transition={{ delay: i * 0.05 }}
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
												{isComplete && (
													<Sparkles className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />
												)}
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
														transition={{
															duration: 0.8,
															delay: i * 0.05 + 0.3,
														}}
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
						})}
					</AnimatePresence>
				</div>
			)}
		</div>
	);
}
