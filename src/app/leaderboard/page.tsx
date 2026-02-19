'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Code2, Crown, Flame, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getCFRatingColor, getCFRatingLabel, getLevelForXP } from '@/lib/utils/constants';

/* Types */

type Board = 'cf_rating' | 'lc_solved' | 'streak' | 'xp';
type XPPeriod = 'weekly' | 'monthly' | 'all';

interface LeaderboardRow {
	rank: number;
	id: string;
	display_name: string;
	roll_number: number;
	xp: number;
	level: number;
	current_streak: number;
	longest_streak?: number;
	cf_handle?: string | null;
	lc_handle?: string | null;
	cf_rating?: number;
	lc_stats?: { easy: number; medium: number; hard: number; total: number };
	period_xp?: number;
}

interface LeaderboardResponse {
	leaderboard: LeaderboardRow[];
	board: string;
	period?: string;
	page: number;
	limit: number;
	total: number;
	my_entry: LeaderboardRow | null;
}

const BOARDS: { key: Board; label: string; icon: React.ReactNode; color: string }[] = [
	{ key: 'cf_rating', label: 'CF Rating', icon: <Crown className="w-4 h-4" />, color: 'neon-cyan' },
	{
		key: 'lc_solved',
		label: 'LC Solved',
		icon: <Code2 className="w-4 h-4" />,
		color: 'neon-orange',
	},
	{ key: 'streak', label: 'Streak', icon: <Flame className="w-4 h-4" />, color: 'neon-red' },
	{ key: 'xp', label: 'XP', icon: <Zap className="w-4 h-4" />, color: 'neon-green' },
];

const XP_PERIODS: { key: XPPeriod; label: string }[] = [
	{ key: 'weekly', label: 'Week' },
	{ key: 'monthly', label: 'Month' },
	{ key: 'all', label: 'All-Time' },
];

const PAGE_SIZE = 10;

// HELPERS

function RankBadge({ rank }: { rank: number }) {
	if (rank === 1)
		return (
			<span className="text-lg" title="1st">
				🥇
			</span>
		);
	if (rank === 2)
		return (
			<span className="text-lg" title="2nd">
				🥈
			</span>
		);
	if (rank === 3)
		return (
			<span className="text-lg" title="3rd">
				🥉
			</span>
		);
	return (
		<span className="font-mono text-sm font-black text-text-muted tabular-nums w-6 text-center">
			{rank}
		</span>
	);
}

function MetricCell({ board, row }: { board: Board; row: LeaderboardRow }) {
	if (board === 'cf_rating') {
		const rating = row.cf_rating ?? 0;
		const color = getCFRatingColor(rating);
		const label = getCFRatingLabel(rating);
		return (
			<div className="flex items-center gap-2">
				<span className="font-mono text-lg font-black tabular-nums" style={{ color }}>
					{rating}
				</span>
				<span
					className="text-tiny font-mono font-bold uppercase tracking-widest"
					style={{ color, opacity: 0.7 }}
				>
					{label}
				</span>
			</div>
		);
	}

	if (board === 'lc_solved') {
		const stats = row.lc_stats ?? { easy: 0, medium: 0, hard: 0, total: 0 };
		return (
			<div className="flex items-center gap-3">
				<span className="font-mono text-lg font-black tabular-nums text-neon-orange">
					{stats.total}
				</span>
				<div className="hidden sm:flex items-center gap-1.5 text-tiny font-mono">
					<span className="text-emerald-400">{stats.easy}E</span>
					<span className="text-text-muted">/</span>
					<span className="text-amber-400">{stats.medium}M</span>
					<span className="text-text-muted">/</span>
					<span className="text-red-400">{stats.hard}H</span>
				</div>
			</div>
		);
	}

	if (board === 'streak') {
		return (
			<div className="flex items-center gap-2">
				<Flame className="w-4 h-4 text-neon-orange" />
				<span className="font-mono text-lg font-black tabular-nums text-neon-orange">
					{row.current_streak}d
				</span>
				{row.longest_streak != null && row.longest_streak > row.current_streak && (
					<span className="text-tiny font-mono text-text-muted">(best: {row.longest_streak}d)</span>
				)}
			</div>
		);
	}

	// XP board
	const xp = row.period_xp ?? row.xp;
	return (
		<div className="flex items-center gap-1.5">
			<Zap className="w-3.5 h-3.5 text-neon-green" />
			<span className="font-mono text-lg font-black tabular-nums text-neon-green">
				{xp.toLocaleString()}
			</span>
			<span className="text-tiny font-mono text-text-muted uppercase">XP</span>
		</div>
	);
}

/* Page */

export default function LeaderboardPage() {
	const { profile, loading: authLoading } = useAuthContext();
	const [board, setBoard] = useState<Board>('cf_rating');
	const [xpPeriod, setXpPeriod] = useState<XPPeriod>('all');
	const [page, setPage] = useState(1);
	const [data, setData] = useState<LeaderboardResponse | null>(null);
	const [loading, setLoading] = useState(true);

	const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

	/* Fetch */
	const fetchLeaderboard = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				board,
				page: String(page),
				limit: String(PAGE_SIZE),
			});
			if (board === 'xp') params.set('period', xpPeriod);

			const res = await fetch(`/api/users/leaderboard?${params}`);
			if (res.ok) {
				const json: LeaderboardResponse = await res.json();
				setData(json);
			}
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}, [board, page, xpPeriod]);

	useEffect(() => {
		fetchLeaderboard();
	}, [fetchLeaderboard]);

	// Reset page on board / period change
	// biome-ignore lint/correctness/useExhaustiveDependencies: Expected, should refresh on board change or changing period
	useEffect(() => {
		setPage(1);
	}, [board, xpPeriod]);

	const activeColor = BOARDS.find((b) => b.key === board)?.color ?? 'neon-cyan';

	// Check if current user is visible on the current page
	const myEntryOnPage = data?.leaderboard.some((r) => r.id === profile?.id);
	const showPinnedRow = data?.my_entry && !myEntryOnPage;

	/* Loading */
	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[900px] mx-auto relative">
			{/* Background glow */}
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-neon-cyan/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-cyan pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-cyan">::</span> Leaderboards
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Rankings across all metrics
				</p>
			</motion.header>

			{/* BOARD SELECTOR */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="flex flex-wrap gap-2 mb-6"
			>
				{BOARDS.map((b) => {
					const isActive = board === b.key;
					return (
						<button
							key={b.key}
							type="button"
							onClick={() => setBoard(b.key)}
							className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest border transition-all duration-200 ${
								isActive
									? `border-${b.color} bg-${b.color}/10 text-${b.color}`
									: 'border-border-hard text-text-muted hover:border-text-muted hover:text-text-secondary'
							}`}
						>
							{b.icon}
							{b.label}
						</button>
					);
				})}
			</motion.div>

			{/* XP PERIOD SUB-TABS */}
			<AnimatePresence mode="wait">
				{board === 'xp' && (
					<motion.div
						key="xp-periods"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="flex gap-1.5 mb-6 overflow-hidden"
					>
						{XP_PERIODS.map((p) => (
							<button
								key={p.key}
								type="button"
								onClick={() => setXpPeriod(p.key)}
								className={`px-3 py-1.5 font-mono text-tiny font-bold uppercase tracking-widest border transition-all ${
									xpPeriod === p.key
										? 'border-neon-green bg-neon-green/10 text-neon-green'
										: 'border-border-hard text-text-muted hover:text-text-secondary'
								}`}
							>
								{p.label}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>

			{/* TABLE */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.15 }}
				className="border border-border-hard bg-surface/50"
			>
				{/* Table header */}
				<div className="flex items-center px-4 py-3 border-b border-border-hard text-tiny font-mono font-black uppercase tracking-widest text-text-muted">
					<span className="w-12 text-center shrink-0">Rank</span>
					<span className="flex-1 pl-3">Player</span>
					<span className="w-48 text-right pr-2 hidden sm:block">
						{board === 'cf_rating' && 'Rating'}
						{board === 'lc_solved' && 'Problems Solved'}
						{board === 'streak' && 'Current Streak'}
						{board === 'xp' && 'XP'}
					</span>
				</div>

				{/* Rows */}
				{loading ? (
					<div className="flex items-center justify-center py-16">
						<div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
					</div>
				) : data && data.leaderboard.length > 0 ? (
					<>
						<AnimatePresence mode="wait">
							<motion.div
								key={`${board}-${xpPeriod}-${page}`}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
							>
								{data.leaderboard.map((row, idx) => {
									const isMe = row.id === profile?.id;
									const levelInfo = getLevelForXP(row.xp);
									return (
										<motion.div
											key={row.id}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: idx * 0.03, duration: 0.3 }}
										>
											<Link
												href={`/profile/${row.id}`}
												className={`flex items-center px-4 py-3 border-b border-border-hard/40 transition-colors dash-row-hover group ${
													isMe ? 'bg-neon-cyan/5 border-l-2 border-l-neon-cyan' : ''
												}`}
											>
												{/* Rank */}
												<div className="w-12 flex items-center justify-center shrink-0">
													<RankBadge rank={row.rank} />
												</div>

												{/* Player info */}
												<div className="flex-1 flex items-center gap-3 pl-1 min-w-0">
													{/* Avatar */}
													<div
														className={`w-8 h-8 flex items-center justify-center font-mono font-black text-sm border shrink-0 ${
															isMe
																? 'bg-neon-cyan/15 border-neon-cyan/30 text-neon-cyan'
																: 'bg-elevated border-border-hard text-text-secondary group-hover:border-text-muted'
														}`}
													>
														{row.display_name.charAt(0).toUpperCase()}
													</div>
													<div className="min-w-0">
														<p
															className={`font-mono text-sm font-bold truncate ${isMe ? 'text-neon-cyan' : 'text-text-primary'}`}
														>
															{row.display_name}
															{isMe && (
																<span className="ml-2 text-tiny text-neon-cyan/60 font-black uppercase tracking-widest">
																	YOU
																</span>
															)}
														</p>
														<p className="font-mono text-tiny text-text-muted">
															Lv.{levelInfo.level} {levelInfo.title}
														</p>
													</div>
												</div>

												{/* Metric */}
												<div className="w-48 flex justify-end shrink-0">
													<MetricCell board={board} row={row} />
												</div>
											</Link>
										</motion.div>
									);
								})}
							</motion.div>
						</AnimatePresence>

						{/* Pinned current user row */}
						{showPinnedRow && data.my_entry && (
							<>
								<div className="px-4 py-1">
									<div className="h-px bg-linear-to-r from-transparent via-neon-cyan/30 to-transparent" />
									<p className="text-center font-mono text-tiny text-text-muted uppercase tracking-widest py-1">
										··· Your Ranking ···
									</p>
									<div className="h-px bg-linear-to-r from-transparent via-neon-cyan/30 to-transparent" />
								</div>
								<Link
									href={`/profile/${data.my_entry.id}`}
									className="flex items-center px-4 py-3 bg-neon-cyan/5 border-l-2 border-l-neon-cyan transition-colors dash-row-hover"
								>
									<div className="w-12 flex items-center justify-center shrink-0">
										<span className="font-mono text-sm font-black text-neon-cyan tabular-nums">
											#{data.my_entry.rank}
										</span>
									</div>
									<div className="flex-1 flex items-center gap-3 pl-1 min-w-0">
										<div className="w-8 h-8 flex items-center justify-center font-mono font-black text-sm border bg-neon-cyan/15 border-neon-cyan/30 text-neon-cyan shrink-0">
											{data.my_entry.display_name.charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0">
											<p className="font-mono text-sm font-bold truncate text-neon-cyan">
												{data.my_entry.display_name}
												<span className="ml-2 text-tiny text-neon-cyan/60 font-black uppercase tracking-widest">
													YOU
												</span>
											</p>
											<p className="font-mono text-tiny text-text-muted">
												Lv.{getLevelForXP(data.my_entry.xp).level}{' '}
												{getLevelForXP(data.my_entry.xp).title}
											</p>
										</div>
									</div>
									<div className="w-48 flex justify-end shrink-0">
										<MetricCell board={board} row={data.my_entry} />
									</div>
								</Link>
							</>
						)}
					</>
				) : (
					<div className="py-16 text-center">
						<Trophy className="w-8 h-8 text-text-muted/30 mx-auto mb-3" />
						<p className="font-mono text-sm text-text-muted">No rankings available yet</p>
					</div>
				)}
			</motion.div>

			{/* PAGINATION */}
			{totalPages > 1 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="flex items-center justify-between mt-4"
				>
					<button
						type="button"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1}
						className="flex items-center gap-1 px-3 py-2 border border-border-hard font-mono text-tiny uppercase tracking-widest font-bold text-text-muted hover:text-text-primary hover:border-neon-cyan/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					>
						<ChevronLeft className="w-3.5 h-3.5" />
						Prev
					</button>

					<div className="flex items-center gap-1">
						{Array.from({ length: totalPages }, (_, i) => i + 1)
							.filter((p) => {
								// Show first, last, and pages near current
								if (p === 1 || p === totalPages) return true;
								if (Math.abs(p - page) <= 1) return true;
								return false;
							})
							.reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
								if (idx > 0 && arr[idx - 1] !== p - 1) {
									acc.push('dots');
								}
								acc.push(p);
								return acc;
							}, [])
							.map((item, idx) =>
								item === 'dots' ? (
									// biome-ignore lint/suspicious/noArrayIndexKey: Just UI elements
									<span key={`dots-${idx}`} className="px-1 text-text-muted font-mono text-tiny">
										···
									</span>
								) : (
									<button
										key={item}
										type="button"
										onClick={() => setPage(item)}
										className={`w-8 h-8 font-mono text-tiny font-bold border transition-all ${
											page === item
												? `border-${activeColor} bg-${activeColor}/10 text-${activeColor}`
												: 'border-border-hard text-text-muted hover:text-text-primary'
										}`}
									>
										{item}
									</button>
								),
							)}
					</div>

					<button
						type="button"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages}
						className="flex items-center gap-1 px-3 py-2 border border-border-hard font-mono text-tiny uppercase tracking-widest font-bold text-text-muted hover:text-text-primary hover:border-neon-cyan/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					>
						Next
						<ChevronRight className="w-3.5 h-3.5" />
					</button>
				</motion.div>
			)}

			{/* TOTAL PARTICIPANTS */}
			{data && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.25 }}
					className="text-center font-mono text-tiny text-text-muted uppercase tracking-widest mt-4"
				>
					{data.total} {data.total === 1 ? 'participant' : 'participants'}
				</motion.p>
			)}
		</div>
	);
}
