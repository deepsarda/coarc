'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ChallengeForm } from '@/components/duels/ChallengeForm';
import {
	ActiveDuelsList,
	type Duel,
	DuelHistoryList,
	type DuelStats,
	DuelStatsBanner,
	PendingDuels,
} from '@/components/duels/DuelsList';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface Profile {
	id: string;
	display_name: string;
	cf_handle: string | null;
}

export default function DuelsPage() {
	const { user, profile } = useAuthContext();
	const [duels, setDuels] = useState<Duel[]>([]);
	const [stats, setStats] = useState<DuelStats>({ total: 0, wins: 0, losses: 0, draws: 0 });
	const [loading, setLoading] = useState(true);
	const [users, setUsers] = useState<Profile[]>([]);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [tab, setTab] = useState<'active' | 'history'>('active');

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchDuels();
		fetchUsers();
	}, []);

	async function fetchDuels() {
		try {
			const res = await fetch('/api/duels/history');
			const data = await res.json();
			setDuels(data.duels ?? []);
			setStats(data.stats ?? { total: 0, wins: 0, losses: 0, draws: 0 });
		} catch (e) {
			console.error(`Error in fetching duels: ${e}`);
		} finally {
			setLoading(false);
		}
	}

	async function fetchUsers() {
		try {
			const res = await fetch('/api/users/leaderboard?board=xp&limit=70');
			const data = await res.json();
			setUsers((data.leaderboard ?? []).filter((u: Profile) => u.id !== user?.id && u.cf_handle));
		} catch {
			/* silent */
		}
	}

	const pendingDuels = duels.filter((d) => d.status === 'pending' && d.challenged_id === user?.id);
	const sentPending = duels.filter((d) => d.status === 'pending' && d.challenger_id === user?.id);
	const activeDuels = duels.filter((d) => d.status === 'active');
	const completedDuels = duels.filter(
		(d) => d.status === 'completed' || d.status === 'expired' || d.status === 'declined',
	);

	async function handleChallenge(userId: string, timeLimit: number) {
		try {
			const res = await fetch('/api/duels/challenge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ challenged_id: userId, time_limit_minutes: timeLimit }),
			});
			const data = await res.json();
			if (res.ok) {
				fetchDuels();
				return { ok: true, msg: '⚔️ Challenge sent!' };
			}
			return { ok: false, msg: `❌ ${data.error}` };
		} catch {
			return { ok: false, msg: '❌ Failed to send challenge' };
		}
	}

	async function handleAccept(duelId: number) {
		setActionLoading(duelId);
		try {
			await fetch(`/api/duels/${duelId}/accept`, { method: 'POST' });
			fetchDuels();
		} catch {
			/* silent */
		} finally {
			setActionLoading(null);
		}
	}

	async function handleDecline(duelId: number) {
		setActionLoading(duelId);
		try {
			await fetch(`/api/duels/${duelId}/decline`, { method: 'POST' });
			fetchDuels();
		} catch {
			/* silent */
		} finally {
			setActionLoading(null);
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-magenta/20 border-t-neon-magenta animate-spin" />
			</div>
		);
	}

	const hasCfHandle = !!profile?.cf_handle;

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[900px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-magenta/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-magenta pl-6 mb-6"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-magenta">::</span> Duels
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Challenge · Compete · Conquer
				</p>
			</motion.header>

			{/* STATS */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
			>
				<DuelStatsBanner stats={stats} />
			</motion.div>

			{/* CHALLENGE FORM */}
			{hasCfHandle ? (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15 }}
				>
					<ChallengeForm users={users} onChallenge={handleChallenge} />
				</motion.div>
			) : (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.15 }}
					className="border border-neon-orange/30 bg-neon-orange/5 p-4 mb-6 font-mono text-sm text-neon-orange"
				>
					⚠️ Link your Codeforces handle in your profile to participate in duels.
				</motion.div>
			)}

			{/* INCOMING CHALLENGES */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<PendingDuels
					duels={pendingDuels}
					onAccept={handleAccept}
					onDecline={handleDecline}
					actionLoading={actionLoading}
				/>
			</motion.div>

			{/* TABS */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.25 }}
				className="flex gap-1 mb-4 border border-border-hard p-1"
			>
				{(
					[
						{
							key: 'active' as const,
							label: `Active (${activeDuels.length + sentPending.length})`,
						},
						{ key: 'history' as const, label: `History (${completedDuels.length})` },
					] as const
				).map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						className={`flex-1 py-2.5 font-mono text-tiny uppercase tracking-widest font-bold transition-colors ${
							tab === t.key
								? 'bg-neon-magenta/10 text-neon-magenta'
								: 'text-text-muted hover:text-text-secondary'
						}`}
					>
						{t.label}
					</button>
				))}
			</motion.div>

			{tab === 'active' && user && (
				<ActiveDuelsList duels={[...activeDuels, ...sentPending]} userId={user.id} />
			)}
			{tab === 'history' && user && <DuelHistoryList duels={completedDuels} userId={user.id} />}
		</div>
	);
}
