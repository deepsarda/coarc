'use client';

import { motion } from 'framer-motion';
import { Crosshair, Sparkles, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type Quest, QuestCard } from '@/components/quests/QuestCard';
import { XP_REWARDS } from '@/lib/utils/constants';

export default function QuestsPage() {
	const [quests, setQuests] = useState<Quest[]>([]);
	const [weekStart, setWeekStart] = useState('');
	const [allCompleted, setAllCompleted] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/quests/active')
			.then((r) => r.json())
			.then((data) => {
				setQuests(data.quests ?? []);
				setWeekStart(data.week_start ?? '');
				setAllCompleted(data.all_completed ?? false);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const weekEnd = weekStart
		? (() => {
				const d = new Date(weekStart);
				d.setDate(d.getDate() + 6);
				return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			})()
		: '';

	const weekStartFormatted = weekStart
		? new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
		: '';

	const completedCount = quests.filter((q) => q.user_progress.completed).length;

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-orange/20 border-t-neon-orange animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[700px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-orange/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-orange pl-6 mb-6"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-orange">::</span> Weekly Quests
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					{weekStartFormatted} - {weekEnd}
				</p>
			</motion.header>

			{/* SUMMARY */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="flex items-center gap-4 mb-6 border border-border-hard p-4"
			>
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1.5">
						<Target className="w-4 h-4 text-neon-orange opacity-60" />
						<span className="dash-sub">Quest Progress</span>
					</div>
					<div className="h-2 bg-void rounded-full overflow-hidden">
						<motion.div
							initial={{ width: 0 }}
							animate={{
								width: `${quests.length > 0 ? (completedCount / quests.length) * 100 : 0}%`,
							}}
							transition={{ duration: 0.8, delay: 0.3 }}
							className={`h-full ${allCompleted ? 'bg-neon-green' : 'bg-neon-orange'}`}
						/>
					</div>
				</div>
				<div className="text-right">
					<p
						className={`font-mono text-2xl font-black ${allCompleted ? 'text-neon-green' : 'text-neon-orange'}`}
					>
						{completedCount}/{quests.length}
					</p>
					<p className="dash-sub">Completed</p>
				</div>
			</motion.div>

			{/* ALL COMPLETED BONUS */}
			{allCompleted && quests.length > 0 && (
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.4, type: 'spring' }}
					className="border border-neon-green/40 bg-neon-green/5 p-4 mb-6 flex items-center gap-3"
				>
					<Sparkles className="w-5 h-5 text-neon-green shrink-0" />
					<div>
						<p className="font-mono text-sm font-bold text-neon-green">All Quests Completed!</p>
						<p className="text-text-muted font-mono text-tiny">
							+{XP_REWARDS.QUEST_ALL_BONUS} XP bonus earned
						</p>
					</div>
				</motion.div>
			)}

			{/* QUESTS LIST */}
			{quests.length === 0 ? (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
					<Crosshair className="w-12 h-12 text-text-dim mx-auto mb-4" />
					<p className="text-text-muted font-mono text-sm">No quests this week</p>
					<p className="text-text-dim font-mono text-tiny mt-1">
						Quests are generated each Monday at 8 AM IST
					</p>
				</motion.div>
			) : (
				<div className="space-y-3">
					{quests.map((quest, i) => (
						<QuestCard key={quest.id} quest={quest} index={i} />
					))}
				</div>
			)}
		</div>
	);
}
