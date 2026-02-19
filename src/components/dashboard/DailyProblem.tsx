"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, ExternalLink, Tag, Zap } from "lucide-react";

interface DailyProblemData {
	id: string;
	problem_name: string;
	problem_rating: number | null;
	problem_url: string;
	tags: string[];
	solved: boolean;
}

interface DailyProblemProps {
	daily: DailyProblemData | null;
	countdown: string;
}

export default function DailyProblem({ daily, countdown }: DailyProblemProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
			className="border border-border-subtle border-l-2 border-l-neon-cyan/50 relative overflow-hidden"
		>
			{/* Subtle glow */}
			<div className="absolute top-0 left-0 w-full h-full bg-neon-cyan/3 pointer-events-none" />

			<div className="flex flex-col md:flex-row items-stretch justify-between relative z-10">
				{/* Problem info */}
				<div className="flex-1 p-5 md:p-7 space-y-3">
					<div className="flex items-center gap-2">
						<span className="text-neon-cyan font-mono text-xs uppercase tracking-widest font-black">
							::
						</span>
						<span className="dash-heading">Daily Problem</span>
					</div>

					{daily ? (
						<>
							<div className="flex items-center gap-3 flex-wrap">
								{daily.solved ? (
									<span className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs uppercase tracking-widest font-black">
										<CheckCircle2 className="w-4 h-4" /> Solved
									</span>
								) : (
									<span className="dash-heading text-text-muted">Unsolved</span>
								)}
								{daily.problem_rating && (
									<span className="dash-sub">R:{daily.problem_rating}</span>
								)}
							</div>
							<h4 className="text-text-primary font-mono text-lg md:text-xl font-black uppercase tracking-tight">
								{daily.problem_name}
							</h4>
							{daily.tags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{daily.tags.slice(0, 4).map((tag) => (
										<span
											key={tag}
											className="flex items-center gap-1 text-text-dim font-mono text-[11px] uppercase tracking-widest"
										>
											<Tag className="w-3 h-3 opacity-50" /> {tag}
										</span>
									))}
								</div>
							)}
							<a
								href={daily.problem_url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 text-neon-cyan font-mono text-xs uppercase tracking-widest font-black hover:underline underline-offset-4"
							>
								Solve Now <ExternalLink className="w-3.5 h-3.5" />
							</a>
						</>
					) : (
						<>
							<div className="dash-heading">
								<Clock className="w-4 h-4" /> Pending
							</div>
							<p className="text-text-muted font-mono text-sm">
								Daily problem has not been set yet. Resets at 08:00 IST.
							</p>
						</>
					)}
				</div>

				{/* Countdown */}
				<div className="border-t md:border-t-0 md:border-l border-border-subtle p-5 md:p-7 flex flex-col items-center justify-center min-w-[160px]">
					<p className="dash-sub flex items-center gap-1 mb-2">
						<Clock className="w-3 h-3" /> Reset_In
					</p>
					<p className="text-text-primary font-mono text-2xl font-black tabular-nums tracking-tighter">
						{countdown}
					</p>
					{daily?.solved && (
						<p className="text-emerald-400 font-mono text-[11px] uppercase tracking-widest font-bold mt-2 flex items-center gap-1">
							<Zap className="w-3 h-3" /> +25 XP
						</p>
					)}
				</div>
			</div>
		</motion.div>
	);
}
