'use client';

import { motion } from 'framer-motion';
import { Crown, Flame, Skull, Star, Swords, TrendingUp, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

export interface HallOfFameEntry {
	id: number;
	category: string;
	title: string;
	value: string | null;
	period: string | null;
	achieved_at: string;
	profiles: {
		id: string;
		display_name: string;
		cf_handle: string | null;
		lc_handle: string | null;
	} | null;
}

const CATEGORY_CONFIG: Record<string, { icon: ReactNode; color: string; label: string }> = {
	monthly_champion: {
		icon: <Crown className="w-5 h-5" />,
		color: 'neon-yellow',
		label: 'Monthly Champion',
	},
	weekly_monarch: {
		icon: <Trophy className="w-5 h-5" />,
		color: 'neon-orange',
		label: 'Weekly Monarch',
	},
	boss_slayer: { icon: <Skull className="w-5 h-5" />, color: 'neon-red', label: 'Boss Slayer' },
	streak_record: {
		icon: <Flame className="w-5 h-5" />,
		color: 'neon-orange',
		label: 'Streak Legend',
	},
	most_problems: {
		icon: <Star className="w-5 h-5" />,
		color: 'neon-green',
		label: 'Most Problems',
	},
	duel_master: {
		icon: <Swords className="w-5 h-5" />,
		color: 'neon-magenta',
		label: 'Duel Master',
	},
	dark_horse: {
		icon: <TrendingUp className="w-5 h-5" />,
		color: 'neon-purple',
		label: 'Dark Horse',
	},
};

function getCategoryConfig(category: string) {
	return (
		CATEGORY_CONFIG[category] ?? {
			icon: <Trophy className="w-5 h-5" />,
			color: 'neon-cyan',
			label: category,
		}
	);
}

export function HallOfFameCard({ entry, index }: { entry: HallOfFameEntry; index: number }) {
	const config = getCategoryConfig(entry.category);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.1 + index * 0.06, type: 'spring', damping: 20 }}
			className="card-brutal scifi-window p-0 overflow-hidden relative group"
		>
			<div className="card-overlay" />
			<div
				className="corner-deco corner-tl"
				style={{ borderColor: `var(--color-${config.color})` }}
			/>
			<div
				className="corner-deco corner-tr"
				style={{ borderColor: `var(--color-${config.color})` }}
			/>
			<div
				className="corner-deco corner-bl"
				style={{ borderColor: `var(--color-${config.color})` }}
			/>
			<div
				className="corner-deco corner-br"
				style={{ borderColor: `var(--color-${config.color})` }}
			/>

			<div className="p-5 relative z-10">
				{/* Category header */}
				<div className="flex items-center gap-2 mb-3">
					<span className={`text-${config.color}`}>{config.icon}</span>
					<span
						className={`px-2 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-${config.color}/30 text-${config.color} bg-${config.color}/5`}
					>
						{config.label}
					</span>
				</div>

				{/* Winner name */}
				<h3 className="font-heading font-black text-text-primary text-lg tracking-tight">
					{entry.profiles?.display_name ?? 'Unknown'}
				</h3>

				{/* Title */}
				<p className={`font-mono text-sm font-bold text-${config.color} mt-1`}>{entry.title}</p>

				{/* Value + Period */}
				<div className="flex items-center justify-between mt-3 pt-3 border-t border-border-hard/30">
					{entry.value && (
						<span className="font-mono text-tiny font-bold text-text-secondary">{entry.value}</span>
					)}
					{entry.period && (
						<span className="font-mono text-tiny text-text-dim uppercase tracking-widest">
							{entry.period}
						</span>
					)}
					{!entry.value && !entry.period && (
						<span className="font-mono text-tiny text-text-dim">
							{new Date(entry.achieved_at).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
							})}
						</span>
					)}
				</div>
			</div>
		</motion.div>
	);
}
