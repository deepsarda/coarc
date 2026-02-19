'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { SpinnerProblem } from './types';
import { CF_TOPICS } from './types';

export function SpinnerTab() {
	const [minRating, setMinRating] = useState(800);
	const [maxRating, setMaxRating] = useState(2000);
	const [topics, setTopics] = useState<string[]>([]);
	const [unsolvedOnly, setUnsolvedOnly] = useState(true);
	const [problem, setProblem] = useState<SpinnerProblem | null>(null);
	const [spinning, setSpinning] = useState(false);

	const toggleTopic = (topic: string) => {
		setTopics((prev) =>
			prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
		);
	};

	const spin = async () => {
		setSpinning(true);
		setProblem(null);
		try {
			const params = new URLSearchParams({
				min_rating: String(minRating),
				max_rating: String(maxRating),
				unsolved: String(unsolvedOnly),
			});
			if (topics.length > 0) params.set('topics', topics.join(','));
			const res = await fetch(`/api/problems/random?${params}`);
			if (!res.ok) return;
			const data = await res.json();
			await new Promise((r) => setTimeout(r, 800));
			setProblem(data.problem ?? null);
		} catch {
			/* silent */
		} finally {
			setSpinning(false);
		}
	};

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
			<div className="border border-border-hard p-5 space-y-4">
				<div>
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-2 block">
						Difficulty Range
					</span>
					<div className="flex items-center gap-3">
						<input
							type="number"
							value={minRating}
							onChange={(e) => setMinRating(Number(e.target.value))}
							step={100}
							min={800}
							max={3500}
							className="form-input w-24 text-sm font-mono"
						/>
						<span className="text-text-muted">--</span>
						<input
							type="number"
							value={maxRating}
							onChange={(e) => setMaxRating(Number(e.target.value))}
							step={100}
							min={800}
							max={3500}
							className="form-input w-24 text-sm font-mono"
						/>
					</div>
				</div>

				<div>
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-2 block">
						Topics
					</span>
					<div className="flex flex-wrap gap-1.5">
						{CF_TOPICS.map((topic) => (
							<button
								key={topic}
								type="button"
								onClick={() => toggleTopic(topic)}
								className={`px-2 py-1 font-mono text-[10px] font-bold border transition-colors ${
									topics.includes(topic)
										? 'border-neon-purple/40 text-neon-purple bg-neon-purple/10'
										: 'border-border-hard text-text-muted hover:text-text-secondary'
								}`}
							>
								{topic}
							</button>
						))}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setUnsolvedOnly(!unsolvedOnly)}
						className={`w-8 h-5 rounded-full transition-colors relative ${
							unsolvedOnly ? 'bg-neon-purple' : 'bg-border-hard'
						}`}
					>
						<div
							className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
								unsolvedOnly ? 'left-3.5' : 'left-0.5'
							}`}
						/>
					</button>
					<span className="font-mono text-sm text-text-secondary">Unsolved only</span>
				</div>
			</div>

			<div className="text-center">
				<button
					type="button"
					onClick={spin}
					disabled={spinning}
					className="px-8 py-3 bg-neon-purple/15 border-2 border-neon-purple/40 font-heading text-lg font-black text-neon-purple uppercase tracking-wider hover:bg-neon-purple/25 transition-all disabled:opacity-50"
				>
					{spinning ? (
						<span className="flex items-center gap-2">
							<RefreshCw className="w-5 h-5 animate-spin" /> SPINNING...
						</span>
					) : (
						'🎰 SPIN'
					)}
				</button>
			</div>

			<AnimatePresence>
				{problem && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0 }}
						transition={{ type: 'spring', damping: 15 }}
						className="border-2 border-neon-purple/40 p-6 text-center"
					>
						<p className="font-mono text-tiny text-neon-purple uppercase tracking-widest font-bold mb-2">
							You got
						</p>
						<a
							href={problem.url}
							target="_blank"
							rel="noopener noreferrer"
							className="font-heading text-xl font-black text-text-primary hover:text-neon-cyan transition-colors inline-flex items-center gap-2"
						>
							{problem.name}
							<ExternalLink className="w-4 h-4 opacity-50" />
						</a>
						{problem.rating && (
							<p className="font-mono text-lg font-bold text-neon-cyan mt-1">{problem.rating}</p>
						)}
						{problem.tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 justify-center mt-3">
								{problem.tags.map((tag) => (
									<span
										key={tag}
										className="font-mono text-[10px] text-text-muted bg-elevated px-1.5 py-0.5"
									>
										{tag}
									</span>
								))}
							</div>
						)}
						<div className="flex items-center justify-center gap-3 mt-4">
							<a
								href={problem.url}
								target="_blank"
								rel="noopener noreferrer"
								className="px-4 py-2 bg-neon-cyan/15 border border-neon-cyan/30 font-mono text-sm font-bold text-neon-cyan"
							>
								Solve Now ↗
							</a>
							<button
								type="button"
								onClick={spin}
								className="px-4 py-2 border border-border-hard font-mono text-sm text-text-muted hover:text-text-secondary transition-colors"
							>
								Spin Again
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
