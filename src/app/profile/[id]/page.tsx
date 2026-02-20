'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Award, Crown, ExternalLink, Flame, Lock, Pencil, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Heatmap from '@/components/dashboard/Heatmap';
import TopicRadar from '@/components/dashboard/TopicRadar';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getCFRatingColor, getCFRatingLabel, getLevelForXP } from '@/lib/utils/constants';
import { extractCfHandle, extractLcHandle } from '@/lib/utils/handles';

/* Types */

interface ProfileData {
	id: string;
	roll_number: number;
	display_name: string;
	cf_handle?: string | null;
	lc_handle?: string | null;
	xp: number;
	level: number;
	current_streak: number;
	longest_streak: number;
	created_at: string;
}

interface BadgeData {
	badge_id: string;
	earned_at: string;
	badges: {
		id: string;
		name: string;
		description: string;
		icon: string;
		category: string;
	};
}

interface CfRatingData {
	new_rating: number;
	contest_name: string;
	timestamp: string;
}

interface LcStatsData {
	easy_solved: number;
	medium_solved: number;
	hard_solved: number;
	total_solved: number;
	contest_rating: number | null;
}

/* Page */

export default function ProfilePage() {
	const params = useParams();
	const router = useRouter();
	const { profile: myProfile, loading: authLoading, refetchProfile } = useAuthContext();

	const userId = params.id as string;

	const [profileData, setProfileData] = useState<ProfileData | null>(null);
	const [badges, setBadges] = useState<BadgeData[]>([]);
	const [allBadges, setAllBadges] = useState<
		{ id: string; name: string; description: string; icon: string; category: string }[]
	>([]);
	const [cfRating, setCfRating] = useState<CfRatingData | null>(null);
	const [lcStats, setLcStats] = useState<LcStatsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/* Edit Profile State */
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState('');
	const [editCf, setEditCf] = useState('');
	const [editLc, setEditLc] = useState('');
	const [editErrors, setEditErrors] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);

	const openEdit = useCallback(() => {
		if (!profileData) return;
		setEditName(profileData.display_name);
		setEditCf(profileData.cf_handle ?? '');
		setEditLc(profileData.lc_handle ?? '');
		setEditErrors({});
		setEditing(true);
	}, [profileData]);

	// Handle /profile/me → redirect to actual user ID
	useEffect(() => {
		if (userId === 'me' && myProfile) {
			router.replace(`/profile/${myProfile.id}`);
		}
	}, [userId, myProfile, router]);

	const isOwnProfile = myProfile?.id === userId;

	/* Fetch profile data */
	const fetchProfile = useCallback(async () => {
		if (userId === 'me') return; // Wait for redirect
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/users/${userId}`);
			if (!res.ok) {
				setError(res.status === 404 ? 'User not found' : 'Failed to load profile');
				return;
			}
			const data = await res.json();
			setProfileData(data.profile);
			setBadges(data.badges ?? []);
			setCfRating(data.cf_rating ?? null);
			setLcStats(data.lc_stats ?? null);
		} catch {
			setError('Failed to load profile');
		} finally {
			setLoading(false);
		}
	}, [userId]);

	const saveEdit = useCallback(async () => {
		if (!editName.trim()) {
			setEditErrors({ name: 'Display name is required' });
			return;
		}
		const cfVal = editCf.trim() ? extractCfHandle(editCf.trim()) || editCf.trim() : null;
		const lcVal = editLc.trim() ? extractLcHandle(editLc.trim()) || editLc.trim() : null;

		setSaving(true);
		setEditErrors({});
		try {
			const res = await fetch('/api/users/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					display_name: editName.trim(),
					cf_handle: cfVal,
					lc_handle: lcVal,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				setEditErrors({ name: data.error || 'Save failed' });
				return;
			}

			// Trigger sync to verify handles and fetch fresh CF/LC data
			if (cfVal || lcVal) {
				await fetch('/api/users/sync', { method: 'POST' });
			}

			await refetchProfile();
			await fetchProfile();
			setEditing(false);
		} catch {
			setEditErrors({ name: 'Network error. Try again.' });
		} finally {
			setSaving(false);
		}
	}, [editName, editCf, editLc, refetchProfile, fetchProfile]);

	/* Fetch all badges for silhouette display */
	const fetchAllBadges = useCallback(async () => {
		try {
			const res = await fetch('/api/gamification/badges');
			if (!res.ok) return;
			const data = await res.json();
			setAllBadges(data.badges ?? []);
		} catch {
			/* silent */
		}
	}, []);

	useEffect(() => {
		fetchProfile();
		fetchAllBadges();
	}, [fetchProfile, fetchAllBadges]);

	const levelInfo = profileData ? getLevelForXP(profileData.xp) : null;
	const xpProgress = levelInfo?.xpForNext
		? Math.round((levelInfo.xpProgress / levelInfo.xpForNext) * 100)
		: 0;

	const earnedBadgeIds = useMemo(() => new Set(badges.map((b) => b.badge_id)), [badges]);

	const memberSince = profileData
		? new Date(profileData.created_at).toLocaleDateString('en-IN', {
				month: 'long',
				year: 'numeric',
			})
		: '';

	/* Loading / Error States */
	if (authLoading || (userId === 'me' && !myProfile)) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<p className="font-mono text-sm text-text-muted">{error}</p>
				<Link
					href="/leaderboard"
					className="font-mono text-tiny text-neon-cyan uppercase tracking-widest font-bold hover:underline"
				>
					← Back to Leaderboard
				</Link>
			</div>
		);
	}

	if (loading || !profileData) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[1000px] mx-auto relative">
			{/* Background glow */}
			<div className="absolute top-0 left-0 w-[400px] h-[400px] bg-neon-cyan/2 rounded-full blur-[150px] pointer-events-none" />

			{/* PROFILE HEADER */}
			<motion.header
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="mb-10"
			>
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
					{/* Avatar */}
					<div className="w-16 h-16 sm:w-20 sm:h-20 bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center font-mono font-black text-3xl text-neon-cyan shrink-0">
						{profileData.display_name.charAt(0).toUpperCase()}
					</div>

					<div className="flex-1 min-w-0">
						<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
							{profileData.display_name}
						</h1>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
							<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold">
								ROLL #{String(profileData.roll_number).padStart(2, '0')}
							</span>
							{levelInfo && (
								<span className="font-mono text-tiny text-neon-cyan uppercase tracking-widest font-bold">
									Lv.{levelInfo.level} {levelInfo.title}
								</span>
							)}
							<span className="font-mono text-tiny text-text-dim uppercase tracking-widest">
								since {memberSince}
							</span>
						</div>

						{/* Platform handles */}
						<div className="flex flex-wrap gap-3 mt-3">
							{profileData.cf_handle && (
								<a
									href={`https://codeforces.com/profile/${profileData.cf_handle}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border-hard text-tiny font-mono text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors"
								>
									CF: {profileData.cf_handle}
									<ExternalLink className="w-3 h-3 opacity-50" />
								</a>
							)}
							{profileData.lc_handle && (
								<a
									href={`https://leetcode.com/u/${profileData.lc_handle}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border-hard text-tiny font-mono text-text-secondary hover:text-neon-orange hover:border-neon-orange/30 transition-colors"
								>
									LC: {profileData.lc_handle}
									<ExternalLink className="w-3 h-3 opacity-50" />
								</a>
							)}
						</div>
					</div>

					{/* Edit button (own profile only) */}
					{isOwnProfile && (
						<button
							type="button"
							onClick={openEdit}
							className="flex items-center gap-1.5 px-4 py-2 border border-border-hard font-mono text-tiny uppercase tracking-widest font-bold text-text-muted hover:text-neon-cyan hover:border-neon-cyan/50 transition-colors shrink-0"
						>
							<Pencil className="w-3 h-3" />
							Edit Profile
						</button>
					)}
				</div>

				{/* XP Progress Bar */}
				{levelInfo?.xpForNext && (
					<div className="mt-6">
						<div className="flex justify-between text-tiny font-mono text-text-muted uppercase font-black mb-1.5 tracking-widest">
							<span className="flex items-center gap-1">
								<Zap className="w-3 h-3 text-cyan-400" />
								Level {levelInfo.level} → {levelInfo.level + 1}
							</span>
							<span className="tabular-nums">
								{profileData.xp.toLocaleString()} XP total · {levelInfo.xpProgress.toLocaleString()}{' '}
								/ {levelInfo.xpForNext.toLocaleString()} to next
							</span>
						</div>
						<div className="h-[6px] w-full bg-void border border-border-hard/30 p-px relative">
							<motion.div
								className="h-full bg-neon-cyan relative"
								initial={{ width: 0 }}
								animate={{ width: `${xpProgress}%` }}
								transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
								style={{ boxShadow: '0 0 12px #00f0ff, 0 0 4px #00f0ff' }}
							>
								<div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#00f0ff,0_0_16px_#00f0ff]" />
							</motion.div>
						</div>
					</div>
				)}
			</motion.header>

			<div className="space-y-12">
				{/* STATS GRID */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<h2 className="dash-heading mb-4">
						<Crown className="w-4 h-4 opacity-50" />
						Stats
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border-hard/20 border border-border-hard">
						{/* CF Rating */}
						<div className="px-4 py-4 border-l-2 border-l-neon-cyan/40">
							<p className="dash-sub mb-1">CF Rating</p>
							{cfRating ? (
								<p
									className="font-mono text-2xl font-black tabular-nums"
									style={{ color: getCFRatingColor(cfRating.new_rating) }}
								>
									{cfRating.new_rating}
								</p>
							) : (
								<p className="font-mono text-xl font-black text-text-muted">--</p>
							)}
							{cfRating && (
								<p
									className="font-mono text-tiny font-bold mt-0.5"
									style={{ color: getCFRatingColor(cfRating.new_rating), opacity: 0.7 }}
								>
									{getCFRatingLabel(cfRating.new_rating)}
								</p>
							)}
						</div>

						{/* LC Solved */}
						<div className="px-4 py-4 border-l-2 border-l-neon-orange/40">
							<p className="dash-sub mb-1">LC Solved</p>
							{lcStats ? (
								<>
									<p className="font-mono text-2xl font-black tabular-nums text-neon-orange">
										{lcStats.total_solved}
									</p>
									<div className="flex items-center gap-1.5 mt-0.5 font-mono text-tiny">
										<span className="text-emerald-400">{lcStats.easy_solved}E</span>
										<span className="text-text-dim">/</span>
										<span className="text-amber-400">{lcStats.medium_solved}M</span>
										<span className="text-text-dim">/</span>
										<span className="text-red-400">{lcStats.hard_solved}H</span>
									</div>
								</>
							) : (
								<p className="font-mono text-xl font-black text-text-muted">--</p>
							)}
						</div>

						{/* Total XP */}
						<div className="px-4 py-4 border-l-2 border-l-neon-green/40">
							<p className="dash-sub mb-1">Total XP</p>
							<p className="font-mono text-2xl font-black tabular-nums text-neon-green">
								{profileData.xp.toLocaleString()}
							</p>
							{levelInfo && (
								<p className="font-mono text-tiny text-text-muted font-bold mt-0.5">
									Level {levelInfo.level}
								</p>
							)}
						</div>

						{/* Badges */}
						<div className="px-4 py-4 border-l-2 border-l-neon-purple/40">
							<p className="dash-sub mb-1">Badges</p>
							<p className="font-mono text-2xl font-black tabular-nums text-neon-purple">
								{badges.length}
							</p>
							{allBadges.length > 0 && (
								<p className="font-mono text-tiny text-text-muted font-bold mt-0.5">
									/ {allBadges.length} total
								</p>
							)}
						</div>
					</div>
				</motion.div>

				{/* STREAK */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15 }}
				>
					<h2 className="dash-heading mb-4">
						<Flame className="w-4 h-4 opacity-50" />
						Streak
					</h2>
					<div className="flex items-center gap-8 border-l-2 border-l-neon-orange/40 pl-4">
						<div>
							<p className="dash-sub mb-1">Current</p>
							<div className="flex items-center gap-2">
								<Flame
									className={`w-5 h-5 ${profileData.current_streak >= 7 ? 'text-neon-orange' : 'text-text-muted'}`}
								/>
								<span className="font-mono text-3xl font-black tabular-nums text-neon-orange">
									{profileData.current_streak}
								</span>
								<span className="font-mono text-tiny text-text-muted uppercase">days</span>
							</div>
						</div>
						<div className="w-px h-10 bg-border-hard" />
						<div>
							<p className="dash-sub mb-1">Best</p>
							<span className="font-mono text-2xl font-black tabular-nums text-text-secondary">
								{profileData.longest_streak}
							</span>
							<span className="font-mono text-tiny text-text-muted uppercase ml-1">days</span>
						</div>
					</div>
				</motion.div>

				{/* SEPARATOR */}
				<div className="dash-divider" />

				{/* BADGES */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<h2 className="dash-heading mb-4">
						<Award className="w-4 h-4 opacity-50" />
						Badges
					</h2>

					{allBadges.length > 0 ? (
						<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
							{allBadges.map((badge) => {
								const earned = earnedBadgeIds.has(badge.id);
								const earnedBadge = badges.find((b) => b.badge_id === badge.id);
								return (
									<div
										key={badge.id}
										className={`relative p-3 border text-center transition-all ${
											earned
												? 'border-neon-cyan/30 bg-neon-cyan/5'
												: 'border-border-hard/40 bg-surface/30 opacity-40'
										}`}
										title={
											earned ? `${badge.name}: ${badge.description}` : `🔒 ${badge.description}`
										}
									>
										<div className="text-2xl mb-1.5">
											{earned ? (
												badge.icon
											) : (
												<Lock className="w-5 h-5 mx-auto text-text-muted/30" />
											)}
										</div>
										<p
											className={`font-mono text-tiny font-bold truncate ${earned ? 'text-text-primary' : 'text-text-muted/50'}`}
										>
											{badge.name}
										</p>
										{earned && earnedBadge && (
											<p className="font-mono text-[9px] text-neon-cyan/60 mt-0.5">
												{new Date(earnedBadge.earned_at).toLocaleDateString('en-IN', {
													day: 'numeric',
													month: 'short',
												})}
											</p>
										)}
									</div>
								);
							})}
						</div>
					) : badges.length > 0 ? (
						<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
							{badges.map((b) => (
								<div
									key={b.badge_id}
									className="p-3 border border-neon-cyan/30 bg-neon-cyan/5 text-center"
									title={`${b.badges.name}: ${b.badges.description}`}
								>
									<div className="text-2xl mb-1.5">{b.badges.icon}</div>
									<p className="font-mono text-tiny font-bold truncate text-text-primary">
										{b.badges.name}
									</p>
									<p className="font-mono text-[9px] text-neon-cyan/60 mt-0.5">
										{new Date(b.earned_at).toLocaleDateString('en-IN', {
											day: 'numeric',
											month: 'short',
										})}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="font-mono text-sm text-text-muted pl-4 border-l-2 border-l-border-hard">
							No badges earned yet
						</p>
					)}
				</motion.div>

				{/* SEPARATOR */}
				<div className="dash-divider" />

				{/* HEATMAP */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.25 }}
				>
					<Heatmap userId={userId} />
				</motion.div>

				{/* SEPARATOR */}
				<div className="dash-divider" />

				{/* TOPIC RADAR */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
				>
					<TopicRadar userId={userId} />
				</motion.div>
			</div>

			{/* EDIT PROFILE MODAL */}
			<AnimatePresence>
				{editing && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4"
						onClick={() => setEditing(false)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{ duration: 0.2 }}
							className="w-full max-w-lg border border-border-hard bg-surface shadow-2xl"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Modal header */}
							<div className="flex items-center justify-between px-6 py-4 border-b border-border-hard">
								<div className="flex items-center gap-2">
									<div className="w-2 h-2 bg-neon-cyan animate-pulse" />
									<span className="font-mono text-tiny text-neon-cyan uppercase tracking-widest font-black">
										Edit Profile
									</span>
								</div>
								<button
									type="button"
									onClick={() => setEditing(false)}
									className="text-text-muted hover:text-text-primary transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							{/* Modal body */}
							<div className="p-6 space-y-5">
								{/* Display Name */}
								<div>
									<label htmlFor="edit-display-name" className="form-label mb-2 block">
										DISPLAY_NAME
									</label>
									<input
										id="edit-display-name"
										type="text"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										className="form-input w-full"
										placeholder="Your display name"
									/>
									{editErrors.name && (
										<p className="text-neon-red text-small mt-1.5 font-mono font-black uppercase">
											{editErrors.name}
										</p>
									)}
								</div>

								{/* CF Handle */}
								<div>
									<label htmlFor="edit-cf-handle" className="form-label mb-2 block">
										CF_HANDLE
									</label>
									<input
										id="edit-cf-handle"
										type="text"
										value={editCf}
										onChange={(e) => setEditCf(e.target.value)}
										className="form-input w-full"
										placeholder="tourist or codeforces.com/profile/tourist"
									/>
								</div>

								{/* LC Handle */}
								<div>
									<label htmlFor="edit-lc-handle" className="form-label mb-2 block">
										LC_HANDLE
									</label>
									<input
										id="edit-lc-handle"
										type="text"
										value={editLc}
										onChange={(e) => setEditLc(e.target.value)}
										className="form-input w-full"
										placeholder="neal_wu or leetcode.com/u/neal_wu"
									/>
								</div>

								{/* Actions */}
								<div className="flex gap-3 pt-2">
									<button
										type="button"
										onClick={() => setEditing(false)}
										className="flex-1 py-2.5 border border-border-hard font-mono text-tiny uppercase tracking-widest font-bold text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={saveEdit}
										disabled={saving || !editName.trim()}
										className="flex-1 btn-neon py-2.5 text-tiny tracking-[0.15em] disabled:grayscale disabled:opacity-30"
									>
										{saving ? 'SAVING...' : 'SAVE CHANGES'}
									</button>
								</div>

								<p className="text-center font-mono text-tiny text-text-dim uppercase tracking-widest">
									Handles accept usernames or profile URLs
								</p>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
