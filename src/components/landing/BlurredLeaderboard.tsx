'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import EncryptedText from '@/components/ui/EncryptedText';

const MOCK_LEADERBOARD = [
	{ rank: 1, name: 'AN DJANANN A', xp: '12400', rating: '2100', streak: '12' },
	{ rank: 2, name: 'ANNANANANA', xp: '11200', rating: '1950', streak: '08' },
	{ rank: 3, name: 'ANAJA AJAJ', xp: '9800', rating: '1820', streak: '05' },
	{ rank: 4, name: 'ANANANANA', xp: '8500', rating: '1740', streak: '15' },
	{ rank: 5, name: 'ANANANA AJAA', xp: '7200', rating: '1680', streak: '02' },
];

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function BlurredLeaderboard() {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-50px' }}
			transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
			className="card-brutal scifi-window p-0 overflow-hidden relative group"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="absolute inset-0 bg-void pointer-events-none z-0" />
			<div className="absolute inset-0 bg-grid-full opacity-10 pointer-events-none z-0" />
			
			{/* Component Corner Decorations */}
			<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-cyan opacity-40 z-20 group-hover:opacity-100 transition-opacity" />
			<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan opacity-40 z-20 group-hover:opacity-100 transition-opacity" />
			<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan opacity-40 z-20 group-hover:opacity-100 transition-opacity" />
			<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-cyan opacity-40 z-20 group-hover:opacity-100 transition-opacity" />

			{/* Window Ribbon */}
			<div className="px-5 py-2.5 border-b border-border-hard flex items-center justify-between bg-zinc-900/80 backdrop-blur-md relative overflow-hidden z-10">
				<div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
				<div className="flex items-center gap-3 relative z-10">
					<div className="flex gap-1.5">
						<div className="w-2 h-2 rounded-full bg-neon-red/70 shadow-[0_0_8px_#ff0040]" />
						<div className="w-2 h-2 rounded-full bg-neon-yellow/70 shadow-[0_0_8px_#ffe600]" />
						<div className="w-2 h-2 rounded-full bg-neon-green/70 shadow-[0_0_8px_#39ff14]" />
					</div>
					<h3 className="font-mono font-black text-text-primary text-tiny uppercase tracking-mega flex items-center gap-2">
						<span className="text-neon-cyan">::</span> Global_Leaderboard
					</h3>
				</div>
				<div className="flex items-center gap-4 relative z-10 sm:hidden">
					<span className="px-2 py-0.5 bg-neon-cyan/10 border border-neon-cyan/30 rounded-none font-mono text-neon-cyan text-tiny uppercase tracking-widest font-black">
						Live_Data
					</span>
				</div>
			</div>

			{/* Table Content */}
			<div className="relative z-10 w-full overflow-hidden">
				<div className="overflow-x-auto scrollbar-hide">
					<table className="w-full text-sm min-w-[480px] md:min-w-0">
					<thead>
						<tr className="text-text-primary font-mono text-small uppercase tracking-widest border-b border-border-hard bg-zinc-900/50">
							<th className="text-left px-6 py-4 w-12 font-black">#</th>
							<th className="text-left px-6 py-4 font-black text-neon-cyan">Ranked_Node</th>
							<th className="text-right px-6 py-4 font-black">Score</th>
							<th className="text-right px-6 py-4 font-black">Rating</th>
							<th className="text-right px-6 py-4 font-black">Streak</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border-hard/30">
						{MOCK_LEADERBOARD.map((row) => (
							<tr
								key={row.rank}
								className="transition-colors hover:bg-neon-cyan/[0.03]"
							>
								<td className="px-3 md:px-6 py-4 md:py-5 font-mono text-neon-cyan text-xs font-black">
									{RANK_MEDAL[row.rank] ?? `0${row.rank}`}
								</td>
								<td className="px-3 md:px-6 py-4 md:py-5 font-mono text-xs text-text-primary uppercase tracking-widest font-bold">
									<EncryptedText text={row.name} scrambling={isHovered} />
								</td>
								<td className="px-3 md:px-6 py-4 md:py-5 font-mono text-right text-xs text-text-secondary uppercase tracking-widest">
									<EncryptedText text={row.xp} scrambling={isHovered} />
								</td>
								<td className="px-3 md:px-6 py-4 md:py-5 font-mono text-right text-xs text-text-secondary uppercase tracking-widest">
									<EncryptedText text={row.rating} scrambling={isHovered} />
								</td>
								<td className="px-3 md:px-6 py-4 md:py-5 font-mono text-right text-xs text-text-secondary uppercase tracking-widest">
									<EncryptedText text={row.streak} scrambling={isHovered} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
				</div>

				{/* Overlay */}
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-[2px] z-20">
					<motion.div 
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						className="text-center p-8 relative"
					>
						<p className="text-white font-mono text-sm mb-8 uppercase tracking-epic font-black drop-shadow-[0_0_10px_rgba(255,b255,b255,0.3)]">
							Sign in to view your rank
						</p>
						<Link
							href="/login"
							className="btn-neon px-12 py-4 text-xs tracking-mega"
						>
							Login to the Arc →
						</Link>
					</motion.div>
				</div>
			</div>
		</motion.div>
	);
}
