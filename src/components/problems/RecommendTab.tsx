'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Recommendation } from './types';
import { SLOT_CONFIG } from './types';

export function RecommendTab() {
	const [recs, setRecs] = useState<Recommendation[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/problems/recommend');
				if (!res.ok) return;
				const data = await res.json();
				setRecs(data.recommendations ?? []);
			} catch (err) {
				console.error('[RecommendTab] Failed to fetch recommendations:', err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="w-8 h-8 border-2 border-neon-purple/20 border-t-neon-purple animate-spin" />
			</div>
		);
	}

	if (recs.length === 0) {
		return (
			<div className="py-16 text-center">
				<Target className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
				<p className="font-mono text-sm text-text-muted">No recommendations yet</p>
				<p className="font-mono text-tiny text-text-muted mt-1">
					Link your CF handle and solve some problems first
				</p>
			</div>
		);
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
			{recs.map((rec, idx) => {
				const config = SLOT_CONFIG[rec.slot] ?? SLOT_CONFIG.weak_topic;
				return (
					<motion.div
						key={rec.slot}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: idx * 0.08 }}
						className="border border-border-hard p-5"
					>
						<div className="flex items-center gap-2 mb-3">
							<span className={config.color}>{config.icon}</span>
							<span
								className={`font-mono text-tiny font-black uppercase tracking-widest ${config.color}`}
							>
								{config.label}
							</span>
						</div>

						<p className="font-mono text-sm text-text-secondary mb-3">{rec.reason}</p>

						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<a
									href={rec.problem.url}
									target="_blank"
									rel="noopener noreferrer"
									className="font-mono text-sm font-bold text-text-primary hover:text-neon-cyan transition-colors inline-flex items-center gap-1"
								>
									{rec.problem.name}
									<ExternalLink className="w-3 h-3 opacity-50" />
								</a>
								<div className="flex items-center gap-2 mt-1 flex-wrap">
									{rec.problem.rating && (
										<span className="font-mono text-tiny text-neon-cyan font-bold">
											{rec.problem.rating}
										</span>
									)}
									{rec.problem.tags.slice(0, 3).map((tag) => (
										<span
											key={tag}
											className="font-mono text-[10px] text-text-muted bg-elevated px-1.5 py-0.5"
										>
											{tag}
										</span>
									))}
								</div>
							</div>
							<a
								href={rec.problem.url}
								target="_blank"
								rel="noopener noreferrer"
								className="shrink-0 px-3 py-1.5 border border-neon-cyan/30 font-mono text-tiny text-neon-cyan font-bold hover:bg-neon-cyan/10 transition-colors"
							>
								Solve ↗
							</a>
						</div>

						{rec.classmates_solved != null && rec.classmates_solved > 0 && (
							<p className="font-mono text-tiny text-text-muted mt-2">
								{rec.classmates_solved} classmate{rec.classmates_solved !== 1 && 's'} solved this
							</p>
						)}
					</motion.div>
				);
			})}
		</motion.div>
	);
}
