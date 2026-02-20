'use client';

import { motion } from 'framer-motion';
import { Clock, ExternalLink, Loader2, Shield, Skull } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BossArchiveCard } from '@/components/boss/BossArchiveCard';
import { BossHealthBar } from '@/components/boss/BossHealthBar';
import { BossSolverList } from '@/components/boss/BossSolverList';

interface BossSolve {
	user_id: string;
	solved_at: string;
	solve_rank: number;
	profiles: { display_name: string } | null;
}

interface ActiveBoss {
	id: number;
	title: string;
	description: string | null;
	problem_url: string;
	difficulty_label: string | null;
	starts_at: string;
	ends_at: string;
	total_hp: number;
	current_hp: number;
	solves_count: number;
	solves: BossSolve[];
}

interface ArchiveBoss {
	id: number;
	title: string;
	difficulty_label: string | null;
	starts_at: string;
	ends_at: string;
	solves_count: number;
	user_solved: boolean;
	user_solve_rank: number | null;
}

const DIFF_COLORS: Record<string, string> = {
	nightmare: 'neon-red',
	brutal: 'neon-orange',
	legendary: 'neon-purple',
	hard: 'neon-yellow',
};

function getDiffColor(label: string | null) {
	return DIFF_COLORS[(label ?? '').toLowerCase()] ?? 'neon-cyan';
}

function useCountdown(targetDate: string) {
	const [timeLeft, setTimeLeft] = useState('');

	useEffect(() => {
		function update() {
			const diff = new Date(targetDate).getTime() - Date.now();
			if (diff <= 0) {
				setTimeLeft('Now');
				return;
			}
			const d = Math.floor(diff / 86400000);
			const h = Math.floor((diff % 86400000) / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			const s = Math.floor((diff % 60000) / 1000);
			if (d > 0) {
				setTimeLeft(`${d}d ${h}h ${m}m`);
			} else {
				setTimeLeft(`${h}h ${m}m ${s}s`);
			}
		}
		update();
		const id = setInterval(update, 1000);
		return () => clearInterval(id);
	}, [targetDate]);

	return timeLeft;
}

export default function BossPage() {
	const [activeBoss, setActiveBoss] = useState<ActiveBoss | null>(null);
	const [userSolved, setUserSolved] = useState(false);
	const [userSolveRank, setUserSolveRank] = useState<number | null>(null);
	const [archive, setArchive] = useState<ArchiveBoss[]>([]);
	const [upcoming, setUpcoming] = useState<
		{
			id: number;
			title: string;
			difficulty_label: string | null;
			starts_at: string;
			ends_at: string;
			problem_url: string;
		}[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [claiming, setClaiming] = useState(false);
	const [claimResult, setClaimResult] = useState<{ rank: number; xp: number } | null>(null);
	const [claimError, setClaimError] = useState('');

	useEffect(() => {
		Promise.all([
			fetch('/api/boss/active').then((r) => r.json()),
			fetch('/api/boss/archive').then((r) => r.json()),
		])
			.then(([activeData, archiveData]) => {
				setActiveBoss(activeData.boss ?? null);
				setUserSolved(activeData.user_solved ?? false);
				setUserSolveRank(activeData.user_solve_rank ?? null);
				setArchive(archiveData.bosses ?? []);
				setUpcoming(activeData.upcoming ?? []);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	async function handleClaimSolve() {
		if (!activeBoss || claiming) return;
		setClaiming(true);
		setClaimError('');

		try {
			const res = await fetch(`/api/boss/${activeBoss.id}/solve`, {
				method: 'POST',
			});
			const data = await res.json();

			if (!res.ok) {
				setClaimError(data.error ?? 'Failed to record solve');
				return;
			}

			setClaimResult({ rank: data.solve_rank, xp: data.xp_earned });
			setUserSolved(true);
			setUserSolveRank(data.solve_rank);
			// Update HP
			setActiveBoss((prev) =>
				prev
					? {
							...prev,
							current_hp: Math.max(0, prev.current_hp - 1),
							solves_count: prev.solves_count + 1,
						}
					: null,
			);
		} catch {
			setClaimError('Network error');
		} finally {
			setClaiming(false);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-red/20 border-t-neon-red animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[700px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-red/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-red pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-red">::</span> Boss Battle
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Slay the Beast · Earn Glory
				</p>
			</motion.header>

			{/* ACTIVE BOSS */}
			{activeBoss ? (
				<ActiveBossSection
					boss={activeBoss}
					userSolved={userSolved}
					userSolveRank={userSolveRank}
					claiming={claiming}
					claimResult={claimResult}
					claimError={claimError}
					onClaimSolve={handleClaimSolve}
				/>
			) : upcoming.length > 0 ? (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="mb-8"
				>
					<h3 className="dash-heading mb-4">
						<Clock className="w-4 h-4 text-neon-orange opacity-60" /> Upcoming Battles
					</h3>
					<div className="space-y-2">
						{upcoming.map((boss) => (
							<UpcomingBossRow key={boss.id} boss={boss} />
						))}
					</div>
				</motion.div>
			) : (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-center py-16 mb-8"
				>
					<Skull className="w-12 h-12 text-text-dim mx-auto mb-4" />
					<p className="text-text-muted font-mono text-sm">No active boss battle</p>
					<p className="text-text-dim font-mono text-tiny mt-1">
						Stay alert! The next boss could appear any time
					</p>
				</motion.div>
			)}

			{/* ARCHIVE */}
			{archive.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<div className="dash-divider mb-6" />
					<h3 className="dash-heading mb-4">
						<Shield className="w-4 h-4 text-neon-red opacity-50" /> Past Battles
					</h3>
					<div className="space-y-1">
						{archive.map((boss, i) => (
							<BossArchiveCard key={boss.id} boss={boss} index={i} />
						))}
					</div>
				</motion.div>
			)}
		</div>
	);
}

function ActiveBossSection({
	boss,
	userSolved,
	userSolveRank,
	claiming,
	claimResult,
	claimError,
	onClaimSolve,
}: {
	boss: ActiveBoss;
	userSolved: boolean;
	userSolveRank: number | null;
	claiming: boolean;
	claimResult: { rank: number; xp: number } | null;
	claimError: string;
	onClaimSolve: () => void;
}) {
	const countdown = useCountdown(boss.ends_at);
	const color = getDiffColor(boss.difficulty_label);

	return (
		<motion.div
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.1 }}
			className="mb-8 space-y-6"
		>
			{/* Title row */}
			<div className="border-l-2 border-neon-red/60 pl-5">
				<div className="flex items-center gap-2 mb-1.5">
					<span className="font-mono text-micro uppercase tracking-widest font-bold text-neon-red animate-pulse-neon">
						Active
					</span>
					{boss.difficulty_label && (
						<span
							className={`px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-${color}/30 text-${color} bg-${color}/5`}
						>
							{boss.difficulty_label}
						</span>
					)}
					<span className="ml-auto flex items-center gap-1.5 text-neon-red">
						<Clock className="w-3.5 h-3.5" />
						<span className="font-mono text-tiny font-bold">{countdown}</span>
					</span>
				</div>
				<h2 className="font-heading text-xl md:text-2xl font-black text-text-primary tracking-tight">
					{boss.title}
				</h2>
				{boss.description && (
					<p className="text-text-secondary text-sm font-mono mt-1.5">{boss.description}</p>
				)}
			</div>

			{/* Health Bar */}
			<BossHealthBar
				currentHP={boss.current_hp}
				totalHP={boss.total_hp}
				solvesCount={boss.solves_count}
			/>

			{/* Actions */}
			<div className="flex flex-col sm:flex-row gap-3">
				<a
					href={boss.problem_url}
					target="_blank"
					rel="noopener noreferrer"
					className="btn-brutal flex-1 flex items-center justify-center gap-2 py-2.5 text-sm"
				>
					<ExternalLink className="w-4 h-4" /> Open Problem
				</a>

				{userSolved ? (
					<div className="flex-1 border border-neon-green/40 bg-neon-green/5 flex items-center justify-center gap-2 py-2.5 text-sm font-mono font-bold text-neon-green">
						✓ Solved{userSolveRank ? ` · Rank #${userSolveRank}` : ''}
					</div>
				) : (
					<button
						type="button"
						onClick={onClaimSolve}
						disabled={claiming}
						className="flex-1 py-2.5 text-sm flex items-center justify-center gap-2 font-mono font-black uppercase tracking-widest border-2 border-neon-red text-neon-red bg-neon-red/5 hover:bg-neon-red/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{claiming ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" /> Verifying…
							</>
						) : (
							<>
								<Skull className="w-4 h-4" /> I&apos;ve Solved It
							</>
						)}
					</button>
				)}
			</div>

			{/* Claim result */}
			{claimResult && (
				<motion.div
					initial={{ opacity: 0, y: 5 }}
					animate={{ opacity: 1, y: 0 }}
					className="border border-neon-green/30 bg-neon-green/5 p-3 text-center"
				>
					<p className="font-mono text-sm font-bold text-neon-green">
						Rank #{claimResult.rank} · +{claimResult.xp} XP earned!
					</p>
				</motion.div>
			)}

			{claimError && (
				<p className="text-neon-red text-tiny font-mono font-bold text-center">{claimError}</p>
			)}

			{/* Solver list */}
			{boss.solves.length > 0 && (
				<>
					<div className="dash-divider" />
					<BossSolverList solvers={boss.solves} />
				</>
			)}
		</motion.div>
	);
}

function UpcomingBossRow({
	boss,
}: {
	boss: {
		id: number;
		title: string;
		difficulty_label: string | null;
		starts_at: string;
		ends_at: string;
		problem_url: string;
	};
}) {
	const color = getDiffColor(boss.difficulty_label);
	const countdown = useCountdown(boss.starts_at);

	return (
		<div className={`border-l-2 border-l-${color}/40 pl-4 py-3 bg-elevated/20`}>
			<div className="flex items-center gap-2 mb-0.5">
				<Skull className={`w-4 h-4 text-${color} opacity-60`} />
				<span className="font-heading font-black text-text-primary text-sm">{boss.title}</span>
				{boss.difficulty_label && (
					<span
						className={`px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-${color}/30 text-${color} bg-${color}/5`}
					>
						{boss.difficulty_label}
					</span>
				)}
			</div>
			<div className="flex items-center gap-3 mt-1">
				<span className="font-mono text-tiny text-neon-orange font-bold flex items-center gap-1">
					<Clock className="w-3 h-3" />
					{countdown === 'Now' ? 'Starting now!' : `Starts in ${countdown}`}
				</span>
				<span className="font-mono text-tiny text-text-dim">
					{new Date(boss.starts_at).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
					})}
				</span>
			</div>
		</div>
	);
}
