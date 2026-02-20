'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';

export interface QuestCondition {
	type?: string;
	topic?: string;
	count?: number;
	[key: string]: unknown;
}

export interface UserProgress {
	progress: number;
	completed: boolean;
	completed_at: string | null;
}

export interface Quest {
	id: number;
	title: string;
	description: string;
	quest_type: string;
	condition: QuestCondition;
	xp_reward: number;
	week_start: string;
	is_admin_curated: boolean;
	user_progress: UserProgress;
}

const QUEST_COLORS: Record<string, string> = {
	topic: 'neon-cyan',
	difficulty: 'neon-orange',
	streak: 'neon-green',
	social: 'neon-magenta',
	duel: 'neon-red',
	study: 'neon-purple',
};

function getQuestColor(type: string) {
	return QUEST_COLORS[type] ?? 'neon-cyan';
}

export function QuestCard({ quest, index }: { quest: Quest; index: number }) {
	const color = getQuestColor(quest.quest_type);
	const condition = quest.condition;
	const required = (condition.count as number) ?? 1;
	const progress = quest.user_progress.progress;
	const completed = quest.user_progress.completed;
	const pct = Math.min(Math.round((progress / required) * 100), 100);

	return (
		<motion.div
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.15 + index * 0.08 }}
			className={`card-brutal p-5 relative overflow-hidden transition-all ${
				completed ? `border-${color}/40` : ''
			}`}
		>
			{completed && (
				<div className="absolute top-3 right-3">
					<CheckCircle2 className={`w-5 h-5 text-${color}`} />
				</div>
			)}

			{/* Quest type badge */}
			<div className="flex items-center gap-2 mb-2">
				<span
					className={`px-2 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-${color}/30 text-${color} bg-${color}/5`}
				>
					{quest.quest_type}
				</span>
				{quest.is_admin_curated && (
					<span className="px-2 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-neon-magenta/30 text-neon-magenta">
						Curated
					</span>
				)}
			</div>

			{/* Title + Description */}
			<h3 className="font-heading font-black text-text-primary text-base mb-1">{quest.title}</h3>
			<p className="text-text-secondary text-sm font-mono mb-4">{quest.description}</p>

			{/* Progress bar */}
			<div className="mb-2">
				<div className="h-2 bg-void rounded-full overflow-hidden">
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: `${pct}%` }}
						transition={{ duration: 0.6, delay: 0.3 + index * 0.08 }}
						className={`h-full bg-${color}`}
					/>
				</div>
			</div>

			{/* Progress text + XP */}
			<div className="flex items-center justify-between">
				<span className="font-mono text-tiny font-bold text-text-muted">
					{progress}/{required} - {pct}%
				</span>
				<span className="flex items-center gap-1 font-mono text-tiny font-bold text-neon-yellow">
					<Zap className="w-3 h-3" /> +{quest.xp_reward} XP
				</span>
			</div>
		</motion.div>
	);
}
