'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Skull } from 'lucide-react';

interface ArchiveBoss {
	id: number;
	title: string;
	difficulty_label: string | null;
	starts_at: string;
	ends_at: string;
	solves_count: number;
	user_solved: boolean;
	user_solve_rank: number | null;
}

const DIFF_COLORS: Record<string, string> = {
	nightmare: 'neon-red',
	brutal: 'neon-orange',
	legendary: 'neon-purple',
	hard: 'neon-yellow',
};

function getDiffColor(label: string | null) {
	return DIFF_COLORS[(label ?? '').toLowerCase()] ?? 'neon-cyan';
}

export function BossArchiveCard({ boss, index }: { boss: ArchiveBoss; index: number }) {
	const color = getDiffColor(boss.difficulty_label);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.1 + index * 0.05 }}
			className={`border-l-2 border-l-${color}/40 pl-4 py-3 hover:bg-elevated/30 transition-colors flex items-center gap-3`}
		>
			<Skull className={`w-5 h-5 text-${color} shrink-0 opacity-60`} />
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-0.5">
					<span className="font-heading font-black text-text-primary text-sm truncate">
						{boss.title}
					</span>
					{boss.difficulty_label && (
						<span
							className={`px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-${color}/30 text-${color} bg-${color}/5 shrink-0`}
						>
							{boss.difficulty_label}
						</span>
					)}
				</div>
				<div className="flex items-center gap-3">
					<span className="font-mono text-tiny text-text-dim">
						{boss.solves_count} solver{boss.solves_count !== 1 ? 's' : ''}
					</span>
					<span className="font-mono text-tiny text-text-dim">
						{new Date(boss.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
					</span>
				</div>
			</div>
			{boss.user_solved && (
				<div className="flex items-center gap-1 shrink-0">
					<CheckCircle2 className="w-4 h-4 text-neon-green" />
					{boss.user_solve_rank && (
						<span className="font-mono text-tiny font-bold text-neon-green">
							#{boss.user_solve_rank}
						</span>
					)}
				</div>
			)}
		</motion.div>
	);
}
