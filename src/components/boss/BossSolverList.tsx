'use client';

import { motion } from 'framer-motion';

interface Solver {
	user_id: string;
	solved_at: string;
	solve_rank: number;
	profiles: { display_name: string } | null;
}

const RANK_STYLES: Record<number, { badge: string; color: string }> = {
	1: { badge: '🥇', color: 'text-neon-yellow' },
	2: { badge: '🥈', color: 'text-text-secondary' },
	3: { badge: '🥉', color: 'text-neon-orange' },
};

export function BossSolverList({ solvers }: { solvers: Solver[] }) {
	if (solvers.length === 0) return null;

	return (
		<div className="space-y-1">
			<h4 className="dash-sub mb-2">Solvers</h4>
			{solvers.map((solver, i) => {
				const rankStyle = RANK_STYLES[solver.solve_rank];
				return (
					<motion.div
						key={solver.user_id}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 + i * 0.05 }}
						className="flex items-center gap-3 py-1.5 px-2 dash-row-hover rounded-sm"
					>
						<span className="font-mono text-sm font-black w-8 text-center">
							{rankStyle ? (
								<span>{rankStyle.badge}</span>
							) : (
								<span className="text-text-dim">#{solver.solve_rank}</span>
							)}
						</span>
						<span
							className={`font-mono text-sm font-bold flex-1 ${rankStyle?.color ?? 'text-text-secondary'}`}
						>
							{solver.profiles?.display_name ?? 'Unknown'}
						</span>
						<span className="font-mono text-tiny text-text-dim">
							{new Date(solver.solved_at).toLocaleString('en-US', {
								month: 'short',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
							})}
						</span>
					</motion.div>
				);
			})}
		</div>
	);
}
