'use client';

import { motion } from 'framer-motion';
import { Filter, Layers, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type Deck, DeckGrid } from '@/components/flashcards/DeckGrid';

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
		if (tagFilter) list = list.filter((d) => d.tags.includes(tagFilter));
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
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search decks..."
						className="form-input pl-10 py-2.5 text-sm"
					/>
				</div>
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
				<DeckGrid decks={filtered} />
			)}
		</div>
	);
}
