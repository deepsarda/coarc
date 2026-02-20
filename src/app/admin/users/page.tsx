'use client';

import { motion } from 'framer-motion';
import { Flame, Shield, ShieldCheck, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface UserProfile {
	id: string;
	roll_number: number;
	display_name: string;
	cf_handle: string | null;
	lc_handle: string | null;
	is_admin: boolean;
	xp: number;
	level: number;
	current_streak: number;
}

export default function AdminUsersPage() {
	const { isAdmin, user } = useAuthContext();
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [toggling, setToggling] = useState<string | null>(null);
	const [msg, setMsg] = useState('');

	async function loadUsers() {
		try {
			const res = await fetch('/api/admin/users');
			const data = await res.json();
			setUsers(data.users ?? []);
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		loadUsers();
	}, []);

	async function toggleAdmin(userId: string, currentStatus: boolean) {
		if (userId === user?.id) {
			setMsg('❌ Cannot modify your own admin status');
			return;
		}
		const target = users.find((u) => u.id === userId);
		const action = currentStatus ? 'remove admin from' : 'make admin';
		if (!confirm(`${action} ${target?.display_name ?? 'this user'}?`)) return;

		setToggling(userId);
		setMsg('');
		try {
			const res = await fetch(`/api/admin/users/${userId}/admin`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_admin: !currentStatus }),
			});
			const data = await res.json();
			if (res.ok) {
				setMsg(
					`✅ ${target?.display_name} is ${!currentStatus ? 'now an admin' : 'no longer an admin'}`,
				);
				loadUsers();
			} else {
				setMsg(`❌ ${data.error}`);
			}
		} catch {
			setMsg('❌ Failed to update admin status');
		} finally {
			setToggling(null);
		}
	}

	if (!isAdmin) {
		return (
			<div className="text-center py-20">
				<p className="text-text-muted font-mono text-sm">Admin access required</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-magenta/20 border-t-neon-magenta animate-spin" />
			</div>
		);
	}

	const adminCount = users.filter((u) => u.is_admin).length;

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[800px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-magenta/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-magenta pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-magenta">::</span> Manage Users
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					{users.length} users · {adminCount} admins
				</p>
			</motion.header>

			{msg && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="font-mono text-sm text-text-secondary mb-4 px-3 py-2 border border-border-hard"
				>
					{msg}
				</motion.p>
			)}

			{/* USER LIST */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
			>
				<h3 className="dash-heading mb-4">
					<Users className="w-4 h-4 text-neon-magenta opacity-50" /> All Users
				</h3>

				<div className="space-y-1.5">
					{users.map((u, i) => {
						const isSelf = u.id === user?.id;
						return (
							<motion.div
								key={u.id}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.12 + i * 0.02 }}
								className={`card-brutal p-4 flex items-center gap-4 ${u.is_admin ? 'border-neon-magenta/20' : ''}`}
							>
								{/* Roll number */}
								<div className="w-10 h-10 flex items-center justify-center border border-border-hard bg-void font-mono text-sm font-black text-text-primary shrink-0">
									{String(u.roll_number).padStart(2, '0')}
								</div>

								{/* User info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-0.5">
										<span className="font-heading font-bold text-text-primary truncate">
											{u.display_name}
										</span>
										{u.is_admin && (
											<span className="px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-neon-magenta/30 text-neon-magenta bg-neon-magenta/5">
												Admin
											</span>
										)}
										{isSelf && (
											<span className="px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-neon-cyan/30 text-neon-cyan">
												You
											</span>
										)}
									</div>
									<div className="flex items-center gap-3 flex-wrap">
										{u.cf_handle && (
											<span className="dash-sub text-neon-cyan">CF: {u.cf_handle}</span>
										)}
										{u.lc_handle && (
											<span className="dash-sub text-neon-orange">LC: {u.lc_handle}</span>
										)}
										<span className="dash-sub flex items-center gap-1">
											<Zap className="w-3 h-3" /> {u.xp.toLocaleString()} XP
										</span>
										<span className="dash-sub flex items-center gap-1">
											<Shield className="w-3 h-3" /> Lv.{u.level}
										</span>
										{u.current_streak > 0 && (
											<span className="dash-sub flex items-center gap-1 text-neon-orange">
												<Flame className="w-3 h-3" /> {u.current_streak}d
											</span>
										)}
									</div>
								</div>

								{/* Admin toggle */}
								<button
									type="button"
									onClick={() => toggleAdmin(u.id, u.is_admin)}
									disabled={isSelf || toggling === u.id}
									className={`p-2 border transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed ${
										u.is_admin
											? 'border-neon-magenta/30 text-neon-magenta hover:bg-neon-magenta/10'
											: 'border-border-hard text-text-muted hover:text-neon-magenta hover:border-neon-magenta/30'
									}`}
									title={
										isSelf ? "Can't modify yourself" : u.is_admin ? 'Remove admin' : 'Make admin'
									}
								>
									{toggling === u.id ? (
										<div className="w-4 h-4 border-2 border-neon-magenta/20 border-t-neon-magenta animate-spin" />
									) : u.is_admin ? (
										<ShieldCheck className="w-4 h-4" />
									) : (
										<Shield className="w-4 h-4" />
									)}
								</button>
							</motion.div>
						);
					})}
				</div>
			</motion.div>
		</div>
	);
}
