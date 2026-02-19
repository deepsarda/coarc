/** biome-ignore-all lint/suspicious/noArrayIndexKey: decorative icons */
"use client";

import {
	Award,
	CalendarDays,
	ChevronRight,
	Flame,
	Shield,
	ShieldOff,
} from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types/gamification";

interface SideInfoProps {
	profile: Profile;
	badgesEarned: number;
	badgesTotal: number;
}

/** Combined streak + badges info */
export default function SideInfo({
	profile,
	badgesEarned,
	badgesTotal,
}: SideInfoProps) {
	const streakActive = profile.current_streak > 0;
	const shieldCount = profile.streak_shields;

	return (
		<div className="space-y-8">
			{/* Streak */}
			<div>
				<h3 className="dash-heading mb-4">
					<Flame className="w-4 h-4 text-orange-400 opacity-60" /> Streak
				</h3>

				{/* 3-cell inline data row */}
				<div className="flex items-stretch divide-x divide-border-subtle">
					<div className="pr-5 flex-1">
						<p className="dash-sub mb-1">Current</p>
						<p
							className={`font-mono text-2xl font-black tracking-tighter ${streakActive ? "text-neon-orange" : "text-text-dim"}`}
						>
							{profile.current_streak}d
						</p>
						{streakActive && (
							<div className="flex mt-1 gap-0.5">
								{Array.from({
									length: Math.min(
										profile.current_streak >= 7
											? 3
											: profile.current_streak >= 3
												? 2
												: 1,
										3,
									),
								}).map((_, i) => (
									<Flame
										key={`streak-fire-${i}`}
										className="w-3.5 h-3.5 text-orange-400/70"
									/>
								))}
							</div>
						)}
					</div>
					<div className="px-5 flex-1">
						<p className="dash-sub mb-1">Best</p>
						<p className="font-mono text-2xl font-black tracking-tighter text-text-primary">
							{profile.longest_streak}d
						</p>
					</div>
					<div className="pl-5 flex-1">
						<p className="dash-sub mb-1">Shields</p>
						<div className="flex items-center gap-0.5 mt-1">
							{shieldCount > 0 ? (
								<>
									{Array.from({ length: Math.min(shieldCount, 3) }).map(
										(_, i) => (
											<Shield
												key={`shield-${i}`}
												className="w-4 h-4 text-emerald-400"
											/>
										),
									)}
									{shieldCount > 3 && (
										<span className="text-emerald-400 font-mono text-[11px] font-bold ml-0.5">
											+{shieldCount - 3}
										</span>
									)}
								</>
							) : (
								<ShieldOff className="w-4 h-4 text-text-dim" />
							)}
						</div>
					</div>
				</div>

				{profile.last_solve_date && (
					<p className="text-text-dim font-mono text-[11px] uppercase tracking-widest mt-3 flex items-center gap-1">
						<CalendarDays className="w-3 h-3" /> Last: {profile.last_solve_date}
					</p>
				)}
			</div>

			{/* thin gradient separator */}
			<div className="dash-divider" />

			{/* Badges */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<h3 className="dash-heading">
						<Award className="w-4 h-4 text-orange-400 opacity-60" /> Badges
					</h3>
					<Link
						href="/profile/me#badges"
						className="flex items-center gap-0.5 text-neon-cyan font-mono text-[11px] uppercase tracking-widest font-bold hover:underline underline-offset-4 transition-colors"
					>
						View All <ChevronRight className="w-3 h-3" />
					</Link>
				</div>
				<div className="flex items-baseline gap-2">
					<span className="font-mono text-3xl font-black text-neon-orange tracking-tighter">
						{badgesEarned}
					</span>
					<span className="font-mono text-lg font-black text-text-dim">
						/ {badgesTotal}
					</span>
					<span className="dash-sub ml-auto">earned</span>
				</div>
				{badgesTotal > 0 && (
					<div className="h-1 w-full bg-void mt-3 overflow-hidden">
						<div
							className="h-full bg-linear-to-r from-orange-400/60 to-neon-orange/40"
							style={{
								width: `${Math.round((badgesEarned / badgesTotal) * 100)}%`,
							}}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
