'use client';

import { motion } from 'framer-motion';
import { Award, ChevronDown, Code2, Crown, Flame, Swords, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getLevelForXP } from '@/lib/utils/constants';

/* Types */

interface UserProfile {
	id: string;
	display_name: string;
	roll_number: number;
	xp: number;
	level: number;
	current_streak: number;
	longest_streak: number;
	cf_handle?: string | null;
	lc_handle?: string | null;
}

interface CompareUser {
	profile: UserProfile;
	badges_count: number;
	cf_rating: number | null;
	lc_stats: {
		total_solved: number;
		easy_solved: number;
		medium_solved: number;
		hard_solved: number;
	} | null;
}

interface CompareData {
	user1: CompareUser;
	user2: CompareUser;
	h2h: { total_duels: number; user1_wins: number; user2_wins: number };
}

interface UserOption {
	id: string;
	display_name: string;
	roll_number: number;
	xp: number;
}

/* Helpers */

function StatBar({
	label,
	icon,
	left,
	right,
	leftColor = 'text-neon-cyan',
	rightColor = 'text-neon-magenta',
	format,
}: {
	label: string;
	icon: React.ReactNode;
	left: number;
	right: number;
	leftColor?: string;
	rightColor?: string;
	format?: (v: number) => string;
}) {
	const max = Math.max(left, right, 1);
	const leftPct = (left / max) * 100;
	const rightPct = (right / max) * 100;
	const fmt = format ?? ((v: number) => String(v));
	const leftWins = left > right;
	const rightWins = right > left;

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span
					className={`font-mono text-lg font-black tabular-nums ${leftWins ? leftColor : 'text-text-muted'}`}
				>
					{fmt(left)}
				</span>
				<span className="flex items-center gap-1.5 text-text-muted">
					{icon}
					<span className="font-mono text-tiny uppercase tracking-widest font-bold">{label}</span>
				</span>
				<span
					className={`font-mono text-lg font-black tabular-nums ${rightWins ? rightColor : 'text-text-muted'}`}
				>
					{fmt(right)}
				</span>
			</div>
			<div className="flex h-2 gap-0.5">
				<div className="flex-1 bg-void border border-border-hard/30 overflow-hidden flex justify-end">
					<motion.div
						className="h-full bg-neon-cyan"
						initial={{ width: 0 }}
						animate={{ width: `${leftPct}%` }}
						transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
						style={{ boxShadow: leftWins ? '0 0 8px #00f0ff' : 'none' }}
					/>
				</div>
				<div className="flex-1 bg-void border border-border-hard/30 overflow-hidden">
					<motion.div
						className="h-full bg-neon-magenta"
						initial={{ width: 0 }}
						animate={{ width: `${rightPct}%` }}
						transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
						style={{ boxShadow: rightWins ? '0 0 8px #ff00aa' : 'none' }}
					/>
				</div>
			</div>
		</div>
	);
}

/* Page */

export default function HeadToHeadPage() {
	const { profile: myProfile, loading: authLoading } = useAuthContext();
	const [allUsers, setAllUsers] = useState<UserOption[]>([]);
	const [user1Id, setUser1Id] = useState('');
	const [user2Id, setUser2Id] = useState('');
	const [data, setData] = useState<CompareData | null>(null);
	const [loading, setLoading] = useState(false);
	const [search1, setSearch1] = useState('');
	const [search2, setSearch2] = useState('');
	const [open1, setOpen1] = useState(false);
	const [open2, setOpen2] = useState(false);

	/* Fetch all users for the selector */
	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/users/leaderboard?board=xp&limit=50');
				if (!res.ok) return;
				const d = await res.json();
				setAllUsers(d.leaderboard ?? []);
			} catch {
				/* silent */
			}
		})();
	}, []);

	/* Default to current user as user1 */
	useEffect(() => {
		if (myProfile && !user1Id) {
			setUser1Id(myProfile.id);
		}
	}, [myProfile, user1Id]);

	/* Fetch comparison */
	const compare = useCallback(async () => {
		if (!user1Id || !user2Id || user1Id === user2Id) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/users/compare?id1=${user1Id}&id2=${user2Id}`);
			if (!res.ok) return;
			setData(await res.json());
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}, [user1Id, user2Id]);

	useEffect(() => {
		if (user1Id && user2Id && user1Id !== user2Id) {
			compare();
		}
	}, [compare, user1Id, user2Id]);

	const filtered1 = useMemo(() => {
		const q = search1.toLowerCase();
		return allUsers.filter(
			(u) =>
				u.id !== user2Id &&
				(u.display_name.toLowerCase().includes(q) || String(u.roll_number).includes(q)),
		);
	}, [allUsers, search1, user2Id]);

	const filtered2 = useMemo(() => {
		const q = search2.toLowerCase();
		return allUsers.filter(
			(u) =>
				u.id !== user1Id &&
				(u.display_name.toLowerCase().includes(q) || String(u.roll_number).includes(q)),
		);
	}, [allUsers, search2, user1Id]);

	const user1Name = allUsers.find((u) => u.id === user1Id)?.display_name ?? 'Select';
	const user2Name = allUsers.find((u) => u.id === user2Id)?.display_name ?? 'Select';

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[900px] mx-auto relative">
			<div className="absolute top-0 left-0 w-[400px] h-[300px] bg-neon-cyan/3 rounded-full blur-[150px] pointer-events-none" />
			<div className="absolute top-0 right-0 w-[400px] h-[300px] bg-neon-magenta/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-magenta pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-magenta">::</span> Head to Head
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Compare two users side-by-side
				</p>
			</motion.header>

			{/* User SELECTORS */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 mb-8 items-start"
			>
				{/* User 1 */}
				<div className="relative">
					<label htmlFor="player1-search" className="form-label mb-2 block text-neon-cyan">
						User 1
					</label>
					<button
						type="button"
						onClick={() => {
							setOpen1(!open1);
							setOpen2(false);
						}}
						className="w-full flex items-center justify-between px-3 py-2.5 border border-neon-cyan/30 bg-surface text-left font-mono text-sm text-text-primary hover:border-neon-cyan/60 transition-colors"
					>
						<span className="truncate">{user1Name}</span>
						<ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
					</button>
					{open1 && (
						<div className="absolute z-20 top-full left-0 right-0 mt-1 border border-border-hard bg-surface shadow-xl max-h-60 overflow-auto">
							<div className="p-2">
								<input
									id="player1-search"
									type="text"
									value={search1}
									onChange={(e) => setSearch1(e.target.value)}
									placeholder="Search..."
									className="form-input w-full text-tiny"
									autoFocus
								/>
							</div>
							{filtered1.map((u) => (
								<button
									key={u.id}
									type="button"
									onClick={() => {
										setUser1Id(u.id);
										setOpen1(false);
										setSearch1('');
									}}
									className={`w-full text-left px-3 py-2 font-mono text-sm hover:bg-elevated transition-colors ${
										u.id === user1Id ? 'text-neon-cyan bg-neon-cyan/5' : 'text-text-primary'
									}`}
								>
									{u.display_name}
									<span className="text-text-muted text-tiny ml-2">
										#{String(u.roll_number).padStart(2, '0')}
									</span>
								</button>
							))}
						</div>
					)}
				</div>

				{/* VS */}
				<div className="hidden sm:flex items-end pb-3">
					<span className="font-heading text-2xl font-black text-text-muted uppercase">VS</span>
				</div>

				{/* User 2 */}
				<div className="relative">
					<label htmlFor="player2-search" className="form-label mb-2 block text-neon-magenta">
						User 2
					</label>
					<button
						type="button"
						onClick={() => {
							setOpen2(!open2);
							setOpen1(false);
						}}
						className="w-full flex items-center justify-between px-3 py-2.5 border border-neon-magenta/30 bg-surface text-left font-mono text-sm text-text-primary hover:border-neon-magenta/60 transition-colors"
					>
						<span className="truncate">{user2Name}</span>
						<ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
					</button>
					{open2 && (
						<div className="absolute z-20 top-full left-0 right-0 mt-1 border border-border-hard bg-surface shadow-xl max-h-60 overflow-auto">
							<div className="p-2">
								<input
									id="player2-search"
									type="text"
									value={search2}
									onChange={(e) => setSearch2(e.target.value)}
									placeholder="Search..."
									className="form-input w-full text-tiny"
									autoFocus
								/>
							</div>
							{filtered2.map((u) => (
								<button
									key={u.id}
									type="button"
									onClick={() => {
										setUser2Id(u.id);
										setOpen2(false);
										setSearch2('');
									}}
									className={`w-full text-left px-3 py-2 font-mono text-sm hover:bg-elevated transition-colors ${
										u.id === user2Id ? 'text-neon-magenta bg-neon-magenta/5' : 'text-text-primary'
									}`}
								>
									{u.display_name}
									<span className="text-text-muted text-tiny ml-2">
										#{String(u.roll_number).padStart(2, '0')}
									</span>
								</button>
							))}
						</div>
					)}
				</div>
			</motion.div>

			{/* COMPARISON RESULTS */}
			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="w-8 h-8 border-2 border-neon-magenta/20 border-t-neon-magenta animate-spin" />
				</div>
			) : data ? (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
					{/* User Headers */}
					<div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
						<div className="text-center">
							<div className="w-14 h-14 mx-auto mb-2 bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center font-mono font-black text-2xl text-neon-cyan">
								{data.user1.profile.display_name.charAt(0).toUpperCase()}
							</div>
							<p className="font-mono text-sm font-bold text-neon-cyan truncate">
								{data.user1.profile.display_name}
							</p>
							<p className="font-mono text-tiny text-text-muted">
								Lv.{getLevelForXP(data.user1.profile.xp).level}
							</p>
						</div>
						<div className="text-center">
							<div className="font-heading text-3xl font-black text-text-muted/30">VS</div>
						</div>
						<div className="text-center">
							<div className="w-14 h-14 mx-auto mb-2 bg-neon-magenta/10 border-2 border-neon-magenta/30 flex items-center justify-center font-mono font-black text-2xl text-neon-magenta">
								{data.user2.profile.display_name.charAt(0).toUpperCase()}
							</div>
							<p className="font-mono text-sm font-bold text-neon-magenta truncate">
								{data.user2.profile.display_name}
							</p>
							<p className="font-mono text-tiny text-text-muted">
								Lv.{getLevelForXP(data.user2.profile.xp).level}
							</p>
						</div>
					</div>

					{/* Stats Comparison */}
					<div className="border border-border-hard p-5 sm:p-8 space-y-6">
						<StatBar
							label="XP"
							icon={<Zap className="w-3.5 h-3.5" />}
							left={data.user1.profile.xp}
							right={data.user2.profile.xp}
							format={(v) => v.toLocaleString()}
						/>

						<StatBar
							label="CF Rating"
							icon={<Crown className="w-3.5 h-3.5" />}
							left={data.user1.cf_rating ?? 0}
							right={data.user2.cf_rating ?? 0}
						/>

						<StatBar
							label="LC Solved"
							icon={<Code2 className="w-3.5 h-3.5" />}
							left={data.user1.lc_stats?.total_solved ?? 0}
							right={data.user2.lc_stats?.total_solved ?? 0}
						/>

						<StatBar
							label="Streak"
							icon={<Flame className="w-3.5 h-3.5" />}
							left={data.user1.profile.current_streak}
							right={data.user2.profile.current_streak}
							format={(v) => `${v}d`}
						/>

						<StatBar
							label="Best Streak"
							icon={<Flame className="w-3.5 h-3.5" />}
							left={data.user1.profile.longest_streak}
							right={data.user2.profile.longest_streak}
							format={(v) => `${v}d`}
						/>

						<StatBar
							label="Badges"
							icon={<Award className="w-3.5 h-3.5" />}
							left={data.user1.badges_count}
							right={data.user2.badges_count}
						/>
					</div>

					{/* H2H Duels */}
					{data.h2h.total_duels > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="border border-border-hard p-5"
						>
							<h3 className="dash-heading mb-4">
								<Swords className="w-4 h-4 opacity-50" />
								Duel Record
							</h3>
							<div className="grid grid-cols-3 text-center">
								<div>
									<p className="font-mono text-2xl font-black text-neon-cyan tabular-nums">
										{data.h2h.user1_wins}
									</p>
									<p className="font-mono text-tiny text-text-muted uppercase">Wins</p>
								</div>
								<div>
									<p className="font-mono text-2xl font-black text-text-muted tabular-nums">
										{data.h2h.total_duels - data.h2h.user1_wins - data.h2h.user2_wins}
									</p>
									<p className="font-mono text-tiny text-text-muted uppercase">Draws</p>
								</div>
								<div>
									<p className="font-mono text-2xl font-black text-neon-magenta tabular-nums">
										{data.h2h.user2_wins}
									</p>
									<p className="font-mono text-tiny text-text-muted uppercase">Wins</p>
								</div>
							</div>
						</motion.div>
					)}

					{/* LC Breakdown */}
					{(data.user1.lc_stats || data.user2.lc_stats) && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.25 }}
							className="border border-border-hard p-5"
						>
							<h3 className="dash-heading mb-4">
								<Code2 className="w-4 h-4 opacity-50" />
								LC Breakdown
							</h3>
							<div className="space-y-4">
								<StatBar
									label="Easy"
									icon={<span className="w-2 h-2 bg-emerald-400 rounded-full" />}
									left={data.user1.lc_stats?.easy_solved ?? 0}
									right={data.user2.lc_stats?.easy_solved ?? 0}
								/>
								<StatBar
									label="Medium"
									icon={<span className="w-2 h-2 bg-amber-400 rounded-full" />}
									left={data.user1.lc_stats?.medium_solved ?? 0}
									right={data.user2.lc_stats?.medium_solved ?? 0}
								/>
								<StatBar
									label="Hard"
									icon={<span className="w-2 h-2 bg-red-400 rounded-full" />}
									left={data.user1.lc_stats?.hard_solved ?? 0}
									right={data.user2.lc_stats?.hard_solved ?? 0}
								/>
							</div>
						</motion.div>
					)}
				</motion.div>
			) : user1Id && user2Id && user1Id === user2Id ? (
				<div className="py-16 text-center">
					<p className="font-mono text-sm text-text-muted">Select two different users to compare</p>
				</div>
			) : !user2Id ? (
				<div className="py-16 text-center">
					<Swords className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
					<p className="font-mono text-sm text-text-muted">
						Select a second user to start the comparison
					</p>
				</div>
			) : null}
		</div>
	);
}
