'use client';

import { motion } from 'framer-motion';

interface BossHealthBarProps {
	currentHP: number;
	totalHP: number;
	solvesCount: number;
}

export function BossHealthBar({ currentHP, totalHP, solvesCount }: BossHealthBarProps) {
	const pct = totalHP > 0 ? (currentHP / totalHP) * 100 : 0;
	const slain = currentHP <= 0;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="dash-sub">Boss HP</span>
				<span
					className={`font-mono text-sm font-black ${slain ? 'text-neon-green' : 'text-neon-red'}`}
				>
					{currentHP} / {totalHP}
				</span>
			</div>
			<div className="h-4 bg-void rounded-sm overflow-hidden border border-border-hard/30 relative">
				<motion.div
					initial={{ width: '100%' }}
					animate={{ width: `${pct}%` }}
					transition={{ duration: 1.2, ease: 'easeOut' }}
					className={`h-full relative ${
						slain
							? 'bg-neon-green'
							: pct > 60
								? 'bg-neon-red'
								: pct > 30
									? 'bg-neon-orange'
									: 'bg-neon-yellow'
					}`}
				>
					{/* Animated scanline effect */}
					<div className="absolute inset-0 bg-linear-to-r from-white/10 via-transparent to-transparent" />
				</motion.div>
			</div>
			<div className="flex items-center justify-between">
				<span className="font-mono text-tiny text-text-dim">
					{solvesCount} solver{solvesCount !== 1 ? 's' : ''}
				</span>
				{slain && (
					<motion.span
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						className="font-mono text-tiny font-bold text-neon-green uppercase tracking-widest"
					>
						✦ Slain
					</motion.span>
				)}
			</div>
		</div>
	);
}
