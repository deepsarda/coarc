"use client";

import { motion } from "framer-motion";
import { CheckSquare2, Crosshair, Square } from "lucide-react";

export interface QuestItem {
	id: string;
	title: string;
	description: string;
	xp_reward: number;
	progress: number;
	target: number;
	completed: boolean;
}

interface QuestsPanelProps {
	quests: QuestItem[];
}

export default function QuestsPanel({ quests }: QuestsPanelProps) {
	const completed = quests.filter((q) => q.completed).length;

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="dash-heading">
					<Crosshair className="w-4 h-4 text-neon-cyan opacity-50" /> Weekly
					Quests
				</h3>
				<span className="dash-sub">
					{completed}/{quests.length}
				</span>
			</div>
			{quests.length > 0 ? (
				<div className="space-y-2">
					{quests.map((q) => (
						<div
							key={q.id}
							className={`flex items-start gap-3 p-3 border-l-2 transition-colors ${
								q.completed
									? "border-l-emerald-400/40 bg-emerald-400/3"
									: "border-l-border-subtle dash-row-hover"
							}`}
						>
							{q.completed ? (
								<CheckSquare2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
							) : (
								<Square className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
							)}
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<span
										className={`font-mono text-xs uppercase tracking-widest font-black truncate ${q.completed ? "text-emerald-400/70 line-through" : "text-text-primary"}`}
									>
										{q.title}
									</span>
									<span className="text-neon-cyan font-mono text-[11px] font-bold shrink-0">
										+{q.xp_reward}
									</span>
								</div>
								<p className="dash-sub mt-0.5">{q.description}</p>
								{!q.completed && q.target > 1 && (
									<div className="mt-2 flex items-center gap-2">
										<div className="flex-1 h-1 bg-void border border-border-subtle">
											<motion.div
												className="h-full bg-fuchsia-500/50"
												initial={{ width: 0 }}
												animate={{
													width: `${Math.min(100, (q.progress / q.target) * 100)}%`,
												}}
											/>
										</div>
										<span className="text-text-dim font-mono text-[10px] tabular-nums">
											{q.progress}/{q.target}
										</span>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			) : (
				<p className="text-text-dim text-sm font-mono pl-6">
					No quests this week yet.
				</p>
			)}
		</div>
	);
}
