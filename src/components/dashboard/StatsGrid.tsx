"use client";

import { motion } from "framer-motion";
import { Flame, Swords, Trophy, Zap } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import type { Profile } from "@/types/gamification";

interface StatsGridProps {
	profile: Profile | null;
	levelInfo: {
		level: number;
		title: string;
		xpProgress: number;
		xpForNext: number | null;
	} | null;
	totalProblems: number;
}

/* Animated stat cell */
function AnimatedStat({
	label,
	value,
	suffix,
	Icon,
	color,
	index,
}: {
	label: string;
	value: number;
	suffix?: string;
	Icon: typeof Zap;
	color: string;
	index: number;
}) {
	const animatedValue = useAnimatedCounter(value, 1400, index * 120);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				delay: index * 0.08,
				duration: 0.5,
				ease: [0.16, 1, 0.3, 1],
			}}
			className={`relative p-5 md:p-7 group cursor-default ${
				index < 3 ? "border-r border-border-subtle" : ""
			} ${index < 2 ? "border-b lg:border-b-0 border-border-subtle" : ""}`}
		>
			{/* Hover glow */}
			<div className="absolute inset-0 bg-neon-cyan/0 group-hover:bg-neon-cyan/2 transition-colors duration-300" />

			<div className="space-y-2 relative">
				<p className="dash-heading">
					<Icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
					{label}
				</p>
				<p
					className={`text-3xl md:text-4xl font-mono font-black tracking-tighter ${color} tabular-nums transition-transform duration-200 group-hover:scale-[1.03] origin-left`}
				>
					{animatedValue.toLocaleString()}
					{suffix ?? ""}
				</p>
			</div>
		</motion.div>
	);
}

export default function StatsGrid({
	profile,
	levelInfo,
	totalProblems,
}: StatsGridProps) {
	const stats = [
		{
			label: "XP",
			value: profile?.xp ?? 0,
			Icon: Zap,
			color: "text-neon-cyan",
		},
		{
			label: "LEVEL",
			value: levelInfo?.level ?? 1,
			Icon: Swords,
			color: "text-text-primary",
		},
		{
			label: "STREAK",
			value: profile?.current_streak ?? 0,
			suffix: "d",
			Icon: Flame,
			color:
				profile && profile.current_streak > 0
					? "text-neon-orange"
					: "text-text-muted",
		},
		{
			label: "SOLVED",
			value: totalProblems,
			Icon: Trophy,
			color: "text-neon-cyan",
		},
	];

	return (
		<div>
			<div className="grid grid-cols-2 lg:grid-cols-4">
				{stats.map((stat, i) => (
					<AnimatedStat
						key={stat.label}
						label={stat.label}
						value={stat.value}
						suffix={stat.suffix}
						Icon={stat.Icon}
						color={stat.color}
						index={i}
					/>
				))}
			</div>
			{/* grounding line */}
			<div className="dash-divider" />
		</div>
	);
}
