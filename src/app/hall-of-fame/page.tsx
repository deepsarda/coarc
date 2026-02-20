'use client';

import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HallOfFameCard, type HallOfFameEntry } from '@/components/hall-of-fame/HallOfFameCard';

export default function HallOfFamePage() {
	const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/gamification/hall-of-fame')
			.then((r) => r.json())
			.then((d) => setEntries(d.entries ?? []))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-yellow/20 border-t-neon-yellow animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[900px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-yellow/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-yellow pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-yellow">::</span> Hall of Fame
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Legends of the Arc
				</p>
			</motion.header>

			{/* ENTRIES GRID */}
			{entries.length === 0 ? (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
					<Crown className="w-12 h-12 text-text-dim mx-auto mb-4" />
					<p className="text-text-muted font-mono text-sm">No legends yet</p>
					<p className="text-text-dim font-mono text-tiny mt-1">
						Champions, slayers, and legends will be immortalized here
					</p>
				</motion.div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{entries.map((entry, i) => (
						<HallOfFameCard key={entry.id} entry={entry} index={i} />
					))}
				</div>
			)}
		</div>
	);
}
