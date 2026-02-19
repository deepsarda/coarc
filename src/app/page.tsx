"use client";

import { motion } from "framer-motion";
import {
	Award,
	BarChart3,
	BookOpen,
	CalendarCheck,
	Flame,
	Library,
	Sparkles,
	Swords,
	Target,
	Trophy,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import BlurredLeaderboard from "@/components/landing/BlurredLeaderboard";
import HeroSection from "@/components/landing/HeroSection";
import JoinCounter from "@/components/landing/JoinCounter";
import { SITE } from "@/lib/config";

/* Feature clusters */
interface Feature {
	icon: ReactNode;
	title: string;
	desc: string;
	xp?: string;
}

interface FeatureCluster {
	label: string;
	title: string;
	color: string;
	borderColor: string;
	features: Feature[];
}

const CLUSTERS: FeatureCluster[] = [
	{
		label: "GROWTH_MODULES",
		title: "Beyond Code",
		color: "text-neon-cyan",
		borderColor: "border-neon-cyan/40",
		features: [
			{
				icon: <CalendarCheck className="w-7 h-7" />,
				title: "Attendance",
				desc: "Track classes, predict skips, never fall below 76%.",
				xp: "Skip calculator",
			},
			{
				icon: <BookOpen className="w-7 h-7" />,
				title: "Flashcards",
				desc: "Admin-curated study decks. Earn XP for every card you master.",
				xp: "+5 XP per card",
			},
			{
				icon: <Library className="w-7 h-7" />,
				title: "Resources",
				desc: "Community-shared links approved by peers.",
				xp: "+20 XP approved",
			},
		],
	},
	{
		label: "TRACKING_ENGINE",
		title: "Your Progress",
		color: "text-neon-green",
		borderColor: "border-neon-green/40",
		features: [
			{
				icon: <Flame className="w-7 h-7" />,
				title: "Streaks",
				desc: "Consecutive solve days with shields. Fire grows with your streak.",
				xp: "+5–50 XP/day",
			},
			{
				icon: <Trophy className="w-7 h-7" />,
				title: "Leaderboards",
				desc: "Weekly, monthly, all-time rankings. Dark horse alerts.",
				xp: "Monarch badge",
			},
			{
				icon: <BarChart3 className="w-7 h-7" />,
				title: "Analytics",
				desc: "Heatmaps, topic radars, rating trajectories. All real-time.",
			},
		],
	},
	{
		label: "COMBAT_SYSTEMS",
		title: "Battle Modes",
		color: "text-neon-red",
		borderColor: "border-neon-red/40",
		features: [
			{
				icon: <Swords className="w-7 h-7" />,
				title: "Duels",
				desc: "Challenge classmates to 1v1 coding battles. Auto-matched problems.",
				xp: "+75 XP win",
			},
			{
				icon: <Target className="w-7 h-7" />,
				title: "Boss Raids",
				desc: "Community bosses with HP bars. Defeat them as a class.",
				xp: "+500 XP first solve",
			},
			{
				icon: <Award className="w-7 h-7" />,
				title: "Weekly Quests",
				desc: "3 quests per week. Complete all for bonus XP.",
				xp: "+50 XP each",
			},
		],
	},
];

const containerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.08,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
	},
};

export default function LandingPage() {
	const [stats, setStats] = useState({
		userCount: 0,
		genesisClaimed: 0,
		genesisRemaining: 20,
		genesisLimit: 20,
	});

	useEffect(() => {
		fetch("/api/stats")
			.then((r) => r.json())
			.then(setStats)
			.catch(() => {});
	}, []);

	return (
		<div className="min-h-svh bg-grid-full overflow-x-hidden w-full max-w-full relative">
			<HeroSection />

			{/* Content sections */}
			<section className="relative z-10 py-12 md:py-24 px-4 max-w-6xl mx-auto space-y-16 md:space-y-32">
				{/* Section Separator */}
				<div className="relative h-24 flex items-center justify-center overflow-hidden">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-border-hard opacity-30" />
					</div>
					<div className="relative px-4 md:px-8 bg-void border-x border-border-hard flex items-center gap-4 py-2">
						<span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-neon-cyan animate-pulse" />
						<span className="font-mono text-tiny md:text-small tracking-mega md:tracking-ultra text-neon-cyan uppercase font-bold text-center">
							SYSTEM_OPERATIONAL
						</span>
						<span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-neon-cyan animate-pulse" />
					</div>
				</div>

				{/* Leaderboard */}
				<div className="relative">
					<BlurredLeaderboard />
				</div>

				{/* Feature Clusters */}
				<div className="space-y-20 md:space-y-28">
					<div className="flex flex-col items-center mb-8 text-center">
						<div className="h-16 w-[2px] bg-linear-to-t from-neon-cyan to-transparent mb-6" />
						<motion.h2
							initial={{ opacity: 0, y: 10 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4 }}
							className="font-heading font-bold text-3xl md:text-4xl tracking-tighter uppercase"
						>
							The Full <span className="text-neon-cyan">Arsenal</span>
						</motion.h2>
						<p className="font-mono text-small md:text-xs text-text-muted mt-2 tracking-mega uppercase">
							MORE_THAN_CODE :: ALL_SYSTEMS_LOADED
						</p>
					</div>

					{CLUSTERS.map((cluster, ci) => (
						<motion.div
							key={cluster.label}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.5, delay: ci * 0.1 }}
							className="relative"
						>
							{/* Cluster header */}
							<div className="flex items-center gap-4 mb-8">
								<div className={`w-1 h-12 ${cluster.borderColor} border-l-2`} />
								<div>
									<p className="font-mono text-tiny text-text-dim uppercase tracking-mega font-black">
										{cluster.label}
									</p>
									<h3
										className={`font-heading font-bold text-2xl md:text-3xl tracking-tight uppercase ${cluster.color}`}
									>
										{cluster.title}
									</h3>
								</div>
							</div>

							{/* Feature cards */}
							<motion.div
								variants={containerVariants}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: "-50px" }}
								className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
							>
								{cluster.features.map((feature) => (
									<motion.div
										key={feature.title}
										variants={itemVariants}
										className={`p-6 card-brutal scifi-window border-t-2 ${cluster.borderColor} group transition-all duration-300 relative overflow-hidden`}
									>
										<div className="card-overlay bg-void/50!" />

										<div className="corner-deco corner-tl w-3 h-3" />
										<div className="corner-deco corner-br w-3 h-3" />

										<div className="flex items-start justify-between mb-5 relative z-10">
											<div
												className={`w-12 h-12 rounded-sm bg-zinc-900 border border-border-hard flex items-center justify-center ${cluster.color} opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300`}
											>
												{feature.icon}
											</div>
											{feature.xp && (
												<span className="font-mono text-tiny text-neon-green font-black tracking-widest uppercase bg-neon-green/5 border border-neon-green/20 px-2 py-0.5">
													{feature.xp}
												</span>
											)}
										</div>

										<h4
											className={`font-mono font-black text-base mb-2 tracking-widest uppercase relative z-10 ${cluster.color}`}
										>
											{feature.title}
										</h4>
										<p className="text-text-secondary text-sm font-mono leading-relaxed opacity-80 relative z-10">
											{feature.desc}
										</p>
									</motion.div>
								))}
							</motion.div>
						</motion.div>
					))}
				</div>

				{/* Combined Join Counter + Info Row */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch pt-8">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: "-50px" }}
						transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
						className="h-full"
					>
						<div className="h-full">
							<JoinCounter count={stats.userCount} />
						</div>
					</motion.div>

					<div className="flex flex-col justify-center space-y-8 p-4">
						<div className="space-y-4">
							<h3 className="font-heading font-black text-2xl text-text-primary tracking-tight uppercase">
								Your journey starts <span className="text-neon-cyan">here</span>
								.
							</h3>
							<p className="text-text-secondary font-mono text-sm leading-relaxed">
								Sync your profiles from Codeforces and LeetCode to start earning
								XP. Track your attendance. Study with flashcards. Everything you
								need, all in one place.
							</p>
						</div>
						<div className="flex flex-wrap gap-4">
							<div className="px-4 py-2 bg-zinc-900 border border-border-hard rounded-sm flex items-center gap-3">
								<div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
								<span className="font-mono text-tiny text-text-primary uppercase tracking-widest">
									Codeforces
								</span>
							</div>
							<div className="px-4 py-2 bg-zinc-900 border border-border-hard rounded-sm flex items-center gap-3">
								<div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
								<span className="font-mono text-tiny text-text-primary uppercase tracking-widest">
									LeetCode
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Genesis Badge - At the end */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					whileInView={{ opacity: 1, scale: 1 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6 }}
					className="max-w-3xl mx-auto pt-12"
				>
					<div className="card-brutal-accent scifi-window p-0 overflow-hidden relative group">
						<div className="card-overlay bg-void!" />

						{/* Corner Decorations */}
						<div className="corner-deco corner-tl" style={{ opacity: 0.5 }} />
						<div className="corner-deco corner-tr" style={{ opacity: 0.5 }} />
						<div className="corner-deco corner-bl" style={{ opacity: 0.5 }} />
						<div className="corner-deco corner-br" style={{ opacity: 0.5 }} />

						{/* Background decorative elements */}
						<div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />
						<div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-magenta/5 -ml-16 -mb-16 rounded-full blur-3xl pointer-events-none" />

						<div className="terminal-bar px-5 border-b-neon-cyan/30">
							<div className="flex items-center gap-3">
								<div className="traffic-lights">
									<div className="status-dot status-dot-red" />
									<div className="status-dot status-dot-yellow" />
									<div className="status-dot status-dot-green" />
								</div>
								<h3 className="scifi-label tracking-mega">
									:: REWARDS :: GENESIS_BADGE
								</h3>
							</div>
							<span className="font-mono text-tiny text-text-dim font-black tracking-widest hidden sm:block">
								EST_2026
							</span>
						</div>

						<div className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
							<div className="flex-1 space-y-7">
								<div className="space-y-3">
									<p className="text-white font-mono text-lg md:text-xl font-black leading-tight uppercase tracking-tight">
										JOIN THE{" "}
										<span className="text-neon-cyan">
											FIRST {stats.genesisLimit} STUDENTS
										</span>
									</p>
									<p className="text-text-secondary text-xs sm:text-small font-mono leading-relaxed">
										The first {stats.genesisLimit} students to connect their
										profiles earn a unique Genesis Badge. This badge is a
										permanent mark on your profile, proving you were here from
										day one.
									</p>
								</div>

								<div className="h-px w-full bg-linear-to-r from-neon-cyan/30 via-neon-cyan/10 to-transparent" />

								<div className="flex items-center gap-8">
									<div>
										<div className="text-small font-mono text-text-muted mb-1 font-black uppercase tracking-widest">
											Remaining
										</div>
										<div className="flex items-baseline gap-1">
											<motion.span
												animate={{ opacity: [1, 0.4, 1] }}
												transition={{ duration: 1.5, repeat: Infinity }}
												className="text-white font-mono text-4xl md:text-5xl font-black tabular-nums tracking-tighter"
											>
												{stats.genesisRemaining}
											</motion.span>
											<span className="text-text-dim font-mono text-lg md:text-xl font-black">
												/{stats.genesisLimit}
											</span>
										</div>
									</div>
									<div className="h-14 w-px bg-border-subtle" />
									<div className="flex-1">
										<div className="h-2.5 w-full bg-void border border-border-hard p-[2px] rounded-none">
											<div
												className="h-full bg-neon-cyan/30 transition-all duration-1000"
												style={{
													width: `${Math.round((stats.genesisClaimed / stats.genesisLimit) * 100)}%`,
												}}
											/>
										</div>
										<p className="text-tiny font-mono text-neon-cyan mt-3 tracking-widest uppercase font-black">
											{stats.genesisClaimed > 0
												? `${stats.genesisClaimed} of ${stats.genesisLimit} badges claimed`
												: "Waiting for first students to join"}
										</p>
									</div>
								</div>
							</div>

							<div className="w-32 h-32 md:w-44 md:h-44 shrink-0 relative">
								<div className="absolute inset-0 bg-neon-cyan/15 blur-2xl animate-pulse pointer-events-none" />
								<div className="w-full h-full rounded-none transform rotate-45 flex items-center justify-center p-4 bg-zinc-900 border-double border-4 border-neon-cyan/20 relative z-10 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
									<div className="transform -rotate-45 text-neon-cyan drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">
										<Sparkles className="w-10 h-10 md:w-14 md:h-14" />
									</div>
								</div>
								{/* Technical accents */}
								<div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-neon-cyan z-20 pointer-events-none" />
								<div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-neon-cyan z-20 pointer-events-none" />
							</div>
						</div>
					</div>
				</motion.div>

				{/* Final CTA */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="text-center py-20 w-full max-w-full overflow-hidden"
				>
					<div className="inline-block relative">
						<div className="absolute -inset-8 bg-neon-cyan/5 blur-3xl rounded-full pointer-events-none" />
						<p className="text-text-muted text-xs font-mono mb-8 uppercase tracking-epic relative">
							Ready to level up?
						</p>

						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.98 }}
							className="w-full flex justify-center"
						>
							<Link
								href="/login"
								className="btn-neon px-8 sm:px-16 py-3 sm:py-4 text-base inline-block"
							>
								JOIN THE ARC →
							</Link>
						</motion.div>
					</div>
				</motion.div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 border-t border-border-subtle py-12 bg-void/50 backdrop-blur-sm w-full max-w-full overflow-hidden">
				<div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-6">
					<div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-xs md:text-small font-mono text-text-secondary tracking-mega uppercase mb-4 font-black">
						<span className="hover:text-neon-cyan transition-colors cursor-pointer relative group whitespace-nowrap">
							Security
							<div className="absolute -bottom-1 left-0 w-0 h-px bg-neon-cyan transition-all group-hover:w-full" />
						</span>
						<span className="hover:text-neon-cyan transition-colors cursor-pointer relative group whitespace-nowrap">
							Protocol
							<div className="absolute -bottom-1 left-0 w-0 h-px bg-neon-cyan transition-all group-hover:w-full" />
						</span>
						<span className="hover:text-neon-cyan transition-colors cursor-pointer relative group whitespace-nowrap">
							Terminal
							<div className="absolute -bottom-1 left-0 w-0 h-px bg-neon-cyan transition-all group-hover:w-full" />
						</span>
					</div>
					<p className="text-text-primary text-xs font-mono uppercase tracking-mega font-black opacity-100 flex items-center justify-center gap-3 text-center w-full px-4">
						<span className="text-neon-cyan/50">::</span>
						{SITE.footer}
						<span className="text-neon-cyan/50">::</span>
					</p>
				</div>
			</footer>
		</div>
	);
}
