'use client';

import { CalendarDays, Flame, Shield, ShieldOff } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { Profile } from '@/types/gamification';

interface StreakCardProps {
	profile: Profile;
}

export default function StreakCard({ profile }: StreakCardProps) {
	const streakActive = profile.current_streak > 0;
	const shieldCount = profile.streak_shields;

	return (
		<Card title="Streak">
			<div className="space-y-3">
				{/* Current streak */}
				<div className="flex items-center justify-between">
					<span className="text-text-muted font-mono text-small uppercase font-black flex items-center gap-1.5">
						<Flame className="w-3.5 h-3.5" /> Current
					</span>
					<div className="flex items-center gap-1.5">
						<span
							className={`font-mono text-xl font-black ${
								streakActive ? 'text-neon-orange' : 'text-neon-red/60'
							}`}
						>
							{profile.current_streak}d
						</span>
						{streakActive && (
							<div className="flex">
								{Array.from({
									length: Math.min(
										profile.current_streak >= 7 ? 3 : profile.current_streak >= 3 ? 2 : 1,
										3,
									),
								}).map((_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: decorative icons
									<Flame key={i} className="w-4 h-4 text-orange-400" />
								))}
							</div>
						)}
					</div>
				</div>

				{/* Best streak */}
				<div className="flex items-center justify-between">
					<span className="text-text-muted font-mono text-small uppercase font-black flex items-center gap-1.5">
						<CalendarDays className="w-3.5 h-3.5" /> Best
					</span>
					<span className="text-text-primary font-mono text-lg font-black">
						{profile.longest_streak}d
					</span>
				</div>

				{/* Shield status */}
				<div className="flex items-center justify-between">
					<span className="text-text-muted font-mono text-small uppercase font-black flex items-center gap-1.5">
						<Shield className="w-3.5 h-3.5" /> Shields
					</span>
					<div className="flex items-center gap-1">
						{shieldCount > 0 ? (
							<>
								{Array.from({ length: Math.min(shieldCount, 3) }).map((_, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: decorative icons
									<Shield key={i} className="w-4 h-4 text-emerald-400" />
								))}
								{shieldCount > 3 && (
									<span className="text-emerald-400 font-mono text-tiny font-bold">
										+{shieldCount - 3}
									</span>
								)}
							</>
						) : (
							<span className="text-neon-red/60 font-mono text-sm font-black flex items-center gap-1">
								<ShieldOff className="w-3.5 h-3.5" /> None
							</span>
						)}
					</div>
				</div>

				{/* Last solved */}
				{profile.last_solve_date && (
					<div className="pt-2 border-t border-border-hard/30">
						<p className="text-text-muted font-mono text-[10px] uppercase tracking-widest">
							Last Solved: {profile.last_solve_date}
						</p>
					</div>
				)}
			</div>
		</Card>
	);
}
