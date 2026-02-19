'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Search, User } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { getLevelForXP } from '@/lib/utils/constants';

interface ProfileResult {
	id: string;
	display_name: string;
	roll_number: number;
	xp: number;
	cf_handle?: string | null;
	lc_handle?: string | null;
}

/* Page */

export default function ProfileSearchPage() {
	const { profile: myProfile, loading: authLoading } = useAuthContext();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<ProfileResult[]>([]);
	const [loading, setLoading] = useState(true);
	const [allUsers, setAllUsers] = useState<ProfileResult[]>([]);

	/* Fetch all users once for client-side search */
	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/users/leaderboard?board=xp&limit=50');
			if (!res.ok) return;
			const data = await res.json();
			setAllUsers(data.leaderboard ?? []);
			setResults(data.leaderboard ?? []);
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	/* Filter on query change */
	useEffect(() => {
		if (!query.trim()) {
			setResults(allUsers);
			return;
		}
		const q = query.toLowerCase();
		setResults(
			allUsers.filter(
				(u) =>
					u.display_name.toLowerCase().includes(q) ||
					u.cf_handle?.toLowerCase().includes(q) ||
					u.lc_handle?.toLowerCase().includes(q) ||
					String(u.roll_number).includes(q),
			),
		);
	}, [query, allUsers]);

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[800px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-cyan/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-cyan pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-cyan">::</span> Find Players
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Search by name, handle, or roll number
				</p>
			</motion.header>

			{/* SEARCH */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="relative mb-6"
			>
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search players..."
					className="form-input w-full pl-10"
					autoFocus
				/>
			</motion.div>

			{/* MY PROFILE LINK */}
			{myProfile && !query.trim() && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.15 }}
					className="mb-4"
				>
					<Link
						href={`/profile/${myProfile.id}`}
						className="flex items-center gap-3 px-4 py-3 border border-neon-cyan/30 bg-neon-cyan/5 transition-colors dash-row-hover"
					>
						<div className="w-9 h-9 bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center font-mono font-black text-sm text-neon-cyan shrink-0">
							{myProfile.display_name.charAt(0).toUpperCase()}
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-mono text-sm font-bold text-neon-cyan truncate">
								{myProfile.display_name}
								<span className="ml-2 text-tiny text-neon-cyan/60 font-black uppercase tracking-widest">
									YOUR PROFILE
								</span>
							</p>
							<p className="font-mono text-tiny text-text-muted">
								Lv.{getLevelForXP(myProfile.xp).level} {getLevelForXP(myProfile.xp).title}
							</p>
						</div>
					</Link>
				</motion.div>
			)}

			{/* RESULTS */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className="border border-border-hard"
			>
				{loading ? (
					<div className="flex items-center justify-center py-16">
						<div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
					</div>
				) : results.length > 0 ? (
					<AnimatePresence mode="popLayout">
						{results.map((user, idx) => {
							const levelInfo = getLevelForXP(user.xp);
							const isMe = user.id === myProfile?.id;
							return (
								<motion.div
									key={user.id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ delay: idx * 0.02 }}
								>
									<Link
										href={`/profile/${user.id}`}
										className={`flex items-center gap-3 px-4 py-3 border-b border-border-hard/40 transition-colors dash-row-hover ${
											isMe ? 'bg-neon-cyan/5' : ''
										}`}
									>
										<div
											className={`w-8 h-8 flex items-center justify-center font-mono font-black text-sm border shrink-0 ${
												isMe
													? 'bg-neon-cyan/15 border-neon-cyan/30 text-neon-cyan'
													: 'bg-elevated border-border-hard text-text-secondary'
											}`}
										>
											{user.display_name.charAt(0).toUpperCase()}
										</div>
										<div className="min-w-0 flex-1">
											<p
												className={`font-mono text-sm font-bold truncate ${isMe ? 'text-neon-cyan' : 'text-text-primary'}`}
											>
												{user.display_name}
											</p>
											<p className="font-mono text-tiny text-text-muted">
												Roll #{String(user.roll_number).padStart(2, '0')} · Lv.{levelInfo.level}
											</p>
										</div>
										<div className="text-tiny font-mono text-text-muted shrink-0">
											{user.cf_handle && <span className="mr-2">CF:{user.cf_handle}</span>}
											{user.lc_handle && <span>LC:{user.lc_handle}</span>}
										</div>
									</Link>
								</motion.div>
							);
						})}
					</AnimatePresence>
				) : (
					<div className="py-16 text-center">
						<User className="w-8 h-8 text-text-muted/20 mx-auto mb-3" />
						<p className="font-mono text-sm text-text-muted">
							No players found for &ldquo;{query}&rdquo;
						</p>
					</div>
				)}
			</motion.div>

			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.25 }}
				className="text-center font-mono text-tiny text-text-muted uppercase tracking-widest mt-4"
			>
				{results.length} player{results.length !== 1 && 's'}
			</motion.p>
		</div>
	);
}
