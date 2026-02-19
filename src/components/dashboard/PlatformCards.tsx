'use client';

import { motion } from 'framer-motion';

import { getCFRatingColor, getCFRatingLabel } from '@/lib/utils/constants';
import type { Profile } from '@/types/gamification';

export interface LcStatsRow {
	easy_solved: number;
	medium_solved: number;
	hard_solved: number;
	total_solved: number;
	contest_rating: number | null;
	synced_at: string;
}

export interface CfStatsRow {
	submission_count: number;
	latest_rating: number | null;
}

interface PlatformCardsProps {
	profile: Profile | null;
	lcStats: LcStatsRow | null;
	cfStats: CfStatsRow | null;
}

export default function PlatformCards({ profile, lcStats, cfStats }: PlatformCardsProps) {
	if (!profile?.cf_handle && !profile?.lc_handle) return null;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-0">
			{/* LeetCode */}
			{profile?.lc_handle && (
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					className="p-5 md:p-7 border-l-2 border-l-orange-400/40 group hover:bg-orange-400/2 transition-colors duration-300"
				>
					<p className="dash-heading mb-4">
						<span className="text-orange-400">::</span> LeetCode
						{lcStats && (
							<span className="ml-3 dash-sub normal-case">
								synced {new Date(lcStats.synced_at).toLocaleDateString('en-IN')}
							</span>
						)}
					</p>
					{lcStats ? (
						<div className="space-y-3">
							<div className="flex items-baseline gap-6">
								<Stat value={lcStats.easy_solved} label="Easy" color="text-emerald-400" />
								<Stat value={lcStats.medium_solved} label="Med" color="text-amber-400" />
								<Stat value={lcStats.hard_solved} label="Hard" color="text-red-400" />
								<div className="ml-auto">
									<Stat value={lcStats.total_solved} label="Total" color="text-neon-cyan" />
								</div>
							</div>
							{lcStats.contest_rating && (
								<div className="pt-3 border-t border-border-subtle flex items-center justify-between">
									<span className="dash-heading">Contest Rating</span>
									<span className="font-mono text-sm font-black text-text-primary">
										{Math.round(lcStats.contest_rating)}
									</span>
								</div>
							)}
						</div>
					) : (
						<p className="text-text-muted font-mono text-sm">
							Hit SYNC to load stats for{' '}
							<span className="text-orange-400">{profile.lc_handle}</span>
						</p>
					)}
				</motion.div>
			)}
			{/* Codeforces */}
			{profile?.cf_handle && (
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					className="p-5 md:p-7 border-l-2 border-l-cyan-400/40 group hover:bg-cyan-400/2 transition-colors duration-300"
				>
					<p className="dash-heading mb-4">
						<span className="text-cyan-400">::</span> Codeforces
					</p>
					{cfStats && (cfStats.latest_rating !== null || cfStats.submission_count > 0) ? (
						<div className="space-y-3">
							<div className="flex items-baseline gap-6">
								<div>
									<p className="dash-heading mb-0.5">Rating</p>
									<div className="flex items-center gap-2">
										<span
											className="font-mono text-2xl font-black"
											style={{
												color: cfStats.latest_rating
													? getCFRatingColor(cfStats.latest_rating)
													: undefined,
											}}
										>
											{cfStats.latest_rating ?? '--'}
										</span>
										{cfStats.latest_rating !== null && (
											<span
												className="font-mono text-[11px] uppercase tracking-widest font-bold px-1.5 py-0.5 border"
												style={{
													color: getCFRatingColor(cfStats.latest_rating),
													borderColor: `${getCFRatingColor(cfStats.latest_rating)}40`,
												}}
											>
												{getCFRatingLabel(cfStats.latest_rating)}
											</span>
										)}
									</div>
								</div>
								<div className="ml-auto">
									<Stat value={cfStats.submission_count} label="AC" color="text-text-primary" />
								</div>
							</div>
						</div>
					) : (
						<p className="text-text-muted font-mono text-sm">
							Hit SYNC to load stats for <span className="text-cyan-400">{profile.cf_handle}</span>
						</p>
					)}
				</motion.div>
			)}
		</div>
	);
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
	return (
		<div>
			<p
				className={`font-mono text-2xl font-black tracking-tighter ${color} transition-transform duration-200 group-hover:scale-105 origin-left`}
			>
				{value}
			</p>
			<p className="dash-sub">{label}</p>
		</div>
	);
}
