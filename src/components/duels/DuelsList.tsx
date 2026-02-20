'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock, ExternalLink, Loader2, Swords, Timer, Trophy, X } from 'lucide-react';

export interface DuelUser {
	id: string;
	display_name: string;
	cf_handle: string | null;
}

export interface Duel {
	id: number;
	challenger_id: string;
	challenged_id: string;
	problem_id: string;
	time_limit_minutes: number;
	status: 'pending' | 'active' | 'completed' | 'expired' | 'declined';
	winner_id: string | null;
	challenger_solve_time: number | null;
	challenged_solve_time: number | null;
	started_at: string | null;
	expires_at: string | null;
	created_at: string;
	challenger: DuelUser;
	challenged: DuelUser;
}

export function getProblemUrl(problemId: string) {
	const contestId = problemId.replace(/[A-Z]+.*/, '');
	const index = problemId.replace(/^\d+/, '');
	return `https://codeforces.com/problemset/problem/${contestId}/${index}`;
}

export function formatSolveTime(seconds: number | null) {
	if (!seconds) return '--';
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

/* PENDING CHALLENGES (incoming) */

interface PendingDuelsProps {
	duels: Duel[];
	onAccept: (id: number) => void;
	onDecline: (id: number) => void;
	actionLoading: number | null;
}

export function PendingDuels({ duels, onAccept, onDecline, actionLoading }: PendingDuelsProps) {
	if (duels.length === 0) return null;

	return (
		<div className="mb-6">
			<h3 className="dash-heading mb-3">
				<Swords className="w-4 h-4 text-neon-cyan opacity-50" /> Incoming Challenges ({duels.length}
				)
			</h3>
			<div className="space-y-2">
				{duels.map((duel) => (
					<div
						key={duel.id}
						className="card-brutal p-4 flex items-center gap-4 border-neon-cyan/30"
					>
						<div className="flex-1 min-w-0">
							<p className="font-mono text-sm font-bold text-text-primary">
								{duel.challenger.display_name}
							</p>
							<div className="flex items-center gap-2 mt-0.5">
								<Timer className="w-3 h-3 text-text-dim" />
								<span className="dash-sub">{duel.time_limit_minutes} min</span>
							</div>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => onAccept(duel.id)}
								disabled={actionLoading === duel.id}
								className="p-2.5 border border-neon-green/40 text-neon-green hover:bg-neon-green/10 transition-colors"
							>
								{actionLoading === duel.id ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Check className="w-4 h-4" />
								)}
							</button>
							<button
								type="button"
								onClick={() => onDecline(duel.id)}
								disabled={actionLoading === duel.id}
								className="p-2.5 border border-neon-red/40 text-neon-red hover:bg-neon-red/10 transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ACTIVE / PENDING SENT DUELS */

interface ActiveDuelsListProps {
	duels: Duel[];
	userId: string;
}

export function ActiveDuelsList({ duels, userId }: ActiveDuelsListProps) {
	const getOpponent = (d: Duel) => (d.challenger_id === userId ? d.challenged : d.challenger);

	if (duels.length === 0) {
		return (
			<div className="text-center py-12">
				<Swords className="w-10 h-10 text-text-dim mx-auto mb-3" />
				<p className="text-text-muted font-mono text-sm">No active duels</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<AnimatePresence mode="popLayout">
				{duels.map((duel) => {
					const opponent = getOpponent(duel);
					const isActive = duel.status === 'active';

					return (
						<motion.div
							key={duel.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							className={`card-brutal p-4 ${isActive ? 'border-neon-green/30' : 'border-neon-yellow/20'}`}
						>
							<div className="flex items-center gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="font-mono text-sm font-bold text-text-primary">
											vs {opponent.display_name}
										</span>
										<span
											className={`px-2 py-0.5 font-mono text-micro uppercase tracking-widest font-bold ${
												isActive
													? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
													: 'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30'
											}`}
										>
											{duel.status}
										</span>
									</div>
									<div className="flex items-center gap-3 mt-1">
										<span className="dash-sub flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{duel.time_limit_minutes}m
										</span>
										{isActive && (
											<a
												href={getProblemUrl(duel.problem_id)}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1 text-neon-cyan font-mono text-tiny uppercase font-bold hover:underline"
											>
												<ExternalLink className="w-3 h-3" />
												Problem {duel.problem_id}
											</a>
										)}
										{duel.status === 'pending' && (
											<span className="dash-sub">Waiting for response...</span>
										)}
									</div>
								</div>
								{isActive && (
									<a
										href={getProblemUrl(duel.problem_id)}
										target="_blank"
										rel="noopener noreferrer"
										className="btn-neon px-4 py-2 text-tiny"
									>
										Solve
									</a>
								)}
							</div>
						</motion.div>
					);
				})}
			</AnimatePresence>
		</div>
	);
}

/* HISTORY LIST */

interface DuelHistoryListProps {
	duels: Duel[];
	userId: string;
}

export function DuelHistoryList({ duels, userId }: DuelHistoryListProps) {
	const getOpponent = (d: Duel) => (d.challenger_id === userId ? d.challenged : d.challenger);

	const getResultColor = (duel: Duel) => {
		if (duel.status !== 'completed') return 'text-text-dim';
		if (!duel.winner_id) return 'text-neon-yellow';
		return duel.winner_id === userId ? 'text-neon-green' : 'text-neon-red';
	};

	const getResultLabel = (duel: Duel) => {
		if (duel.status === 'expired') return 'EXPIRED';
		if (duel.status === 'declined') return 'DECLINED';
		if (duel.status !== 'completed') return duel.status.toUpperCase();
		if (!duel.winner_id) return 'DRAW';
		return duel.winner_id === userId ? 'WIN' : 'LOSS';
	};

	if (duels.length === 0) {
		return (
			<div className="text-center py-12">
				<Trophy className="w-10 h-10 text-text-dim mx-auto mb-3" />
				<p className="text-text-muted font-mono text-sm">No completed duels yet</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{duels.map((duel) => {
				const opponent = getOpponent(duel);

				return (
					<motion.div
						key={duel.id}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="card-brutal p-4"
					>
						<div className="flex items-center gap-4">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="font-mono text-sm font-bold text-text-primary">
										vs {opponent.display_name}
									</span>
									<span
										className={`px-2 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border ${getResultColor(duel)}`}
										style={{ borderColor: 'currentColor', opacity: 0.8 }}
									>
										{getResultLabel(duel)}
									</span>
								</div>
								<div className="flex items-center gap-3 mt-1">
									<a
										href={getProblemUrl(duel.problem_id)}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 text-text-muted font-mono text-tiny uppercase font-bold hover:text-neon-cyan transition-colors"
									>
										<ExternalLink className="w-3 h-3" />
										{duel.problem_id}
									</a>
									<span className="dash-sub">{new Date(duel.created_at).toLocaleDateString()}</span>
								</div>
							</div>

							{duel.status === 'completed' && (
								<div className="text-right">
									<div className="flex items-center gap-3">
										<div className="text-center">
											<p className="font-mono text-tiny font-bold text-text-dim">You</p>
											<p className="font-mono text-sm font-bold text-text-primary">
												{formatSolveTime(
													duel.challenger_id === userId
														? duel.challenger_solve_time
														: duel.challenged_solve_time,
												)}
											</p>
										</div>
										<span className="text-text-dim text-tiny">vs</span>
										<div className="text-center">
											<p className="font-mono text-tiny font-bold text-text-dim">Opp</p>
											<p className="font-mono text-sm font-bold text-text-primary">
												{formatSolveTime(
													duel.challenger_id === userId
														? duel.challenged_solve_time
														: duel.challenger_solve_time,
												)}
											</p>
										</div>
									</div>
								</div>
							)}
						</div>
					</motion.div>
				);
			})}
		</div>
	);
}

/* STATS BANNER */

export interface DuelStats {
	total: number;
	wins: number;
	losses: number;
	draws: number;
}

export function DuelStatsBanner({ stats }: { stats: DuelStats }) {
	return (
		<div className="grid grid-cols-4 divide-x divide-border-hard border border-border-hard mb-6">
			{[
				{ label: 'WINS', value: stats.wins, color: 'text-neon-green' },
				{ label: 'LOSSES', value: stats.losses, color: 'text-neon-red' },
				{ label: 'DRAWS', value: stats.draws, color: 'text-neon-yellow' },
				{ label: 'TOTAL', value: stats.total, color: 'text-neon-cyan' },
			].map((s) => (
				<div key={s.label} className="p-3 sm:p-4 text-center">
					<p className={`font-mono text-xl sm:text-2xl font-black ${s.color}`}>{s.value}</p>
					<p className="dash-sub mt-0.5">{s.label}</p>
				</div>
			))}
		</div>
	);
}
