export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import Card from "@/components/ui/Card";

export default function DashboardPage() {
	return (
		<div className="p-4 sm:p-8 pb-24 sm:pb-8 space-y-6 md:space-y-10 relative">
			{/* Ambient background accent */}
			<div className="absolute top-0 right-0 w-[400px] h-[400px] bg-neon-cyan/2 rounded-full blur-[120px] pointer-events-none" />

			{/* Header */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-neon-cyan pl-6"
			>
				<div>
					<h1 className="font-heading text-2xl md:text-4xl font-black text-text-primary uppercase tracking-tighter">
						CONTROL_DASHBOARD
					</h1>
					<p className="text-text-muted text-small font-mono mt-2 uppercase tracking-epic font-bold">
						SYSTEM_STATUS :: CONNECTED
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="w-2.5 h-2.5 bg-neon-green rounded-none animate-pulse" />
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-black">
						Stable
					</span>
				</div>
			</motion.div>

			{/* Quick stats */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
				{[
					{
						label: "XP_VAL",
						value: "0000",
						icon: "⚡",
						color: "text-neon-cyan",
					},
					{
						label: "LVL_INDEX",
						value: "00",
						icon: "📊",
						color: "text-text-primary",
					},
					{
						label: "STREAK_VAL",
						value: "0d",
						icon: "🔥",
						color: "text-neon-red/80",
					},
					{
						label: "RANK_GLOBAL",
						value: "---",
						icon: "🏆",
						color: "text-neon-cyan",
					},
				].map((stat, i) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
					>
						<Card className="h-full">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="text-text-muted text-tiny md:text-small font-mono uppercase tracking-widest font-black">
										{stat.label}
									</p>
									<p
										className={`text-2xl md:text-4xl font-mono font-black tracking-tighter ${stat.color}`}
									>
										{stat.value}
									</p>
								</div>
								<div className="w-10 h-10 rounded-none bg-void border border-border-hard flex items-center justify-center text-xl grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
									{stat.icon}
								</div>
							</div>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Daily Problem section */}
			<motion.div
				initial={{ opacity: 0, scale: 0.98 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.4 }}
			>
				<Card
					title="Daily Problem"
					glow
					className="border-l-4 border-l-neon-cyan"
				>
					<div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
						<div className="flex-1 space-y-3">
							<div className="flex items-center gap-3">
								<div className="px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-tiny font-black uppercase tracking-widest">
									Pending
								</div>
								<span className="text-text-muted font-mono text-small uppercase font-bold tracking-tighter">
									Status: Queued
								</span>
							</div>
							<h4 className="text-white font-mono text-lg md:text-xl font-black uppercase tracking-tight">
								Daily problem has not been set yet.
							</h4>
							<p className="text-text-secondary text-sm font-mono leading-relaxed">
								Check back later for today's challenge. The reset occurs every day at 08:00 IST.
							</p>
						</div>
						<div className="w-full md:w-auto">
							<div className="p-6 bg-zinc-950 border border-border-hard flex flex-col items-center justify-center gap-2 min-w-[200px]">
								<p className="text-text-muted font-mono text-tiny uppercase tracking-widest font-black">
									Reset_In
								</p>
								<p className="text-text-primary font-mono text-2xl font-black tabular-nums tracking-tighter">
									00:00:00
								</p>
							</div>
						</div>
					</div>
				</Card>
			</motion.div>

			{/* Main Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Recent Activity - Takes more space */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="lg:col-span-2"
				>
					<Card title="Activity_Log" className="h-full">
						<div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
							<div className="w-16 h-16 rounded-none border border-border-hard flex items-center justify-center text-3xl opacity-20">
								📡
							</div>
							<div className="space-y-1">
								<p className="text-text-muted font-mono text-small uppercase tracking-widest font-black">
									LOG_DATA_EMPTY
								</p>
								<p className="text-text-secondary text-sm font-mono max-w-sm text-center">
									No recent activity has been recorded.
								</p>
							</div>
						</div>
					</Card>
				</motion.div>

				{/* Side Panels */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="space-y-6"
				>
					<Card title="Rankings">
						<div className="space-y-4">
							<div className="flex items-center justify-between p-3 bg-zinc-950 border border-border-hard/50">
								<span className="text-text-muted font-mono text-small uppercase font-black">
									ELO Rating
								</span>
								<span className="text-text-primary font-mono text-sm font-black">
									1200
								</span>
							</div>
							<p className="text-text-muted text-small font-mono leading-relaxed px-1">
								Participate in battles to establish your rank.
							</p>
						</div>
					</Card>

					<Card title="Weekly Quests">
						<div className="space-y-6">
							<div className="space-y-2">
								<div className="flex justify-between text-tiny font-mono text-text-muted uppercase font-black">
									<span>Progress</span>
									<span>0%</span>
								</div>
								<div className="h-1.5 w-full bg-void border border-border-hard p-[1px]">
									<div className="h-full w-0 bg-neon-cyan shadow-[0_0_8px_#00f0ff]" />
								</div>
							</div>
							<p className="text-text-muted text-small font-mono leading-relaxed italic">
								{/* Complete weekly challenges to earn more XP. */}
								Complete weekly challenges to earn more XP.
							</p>
						</div>
					</Card>
				</motion.div>
			</div>
		</div>
	);
}
