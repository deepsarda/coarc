'use client';

import { motion } from 'framer-motion';
import {
	BookOpen,
	CalendarDays,
	Flame,
	Layers,
	Megaphone,
	ScrollText,
	Shield,
	Skull,
	Swords,
	Users,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface PlatformStats {
	total_users: number;
	total_cf_solves: number;
	active_streaks: number;
	total_duels: number;
	shared_problems: number;
	approved_resources: number;
	boss_battles: number;
	total_xp_awarded: number;
	average_level: number;
}

const ADMIN_LINKS = [
	{
		href: '/admin/users',
		label: 'Users',
		desc: 'Manage users & admin flags',
		icon: Users,
		color: 'neon-magenta',
	},
	{
		href: '/admin/courses',
		label: 'Courses',
		desc: 'Create & manage courses',
		icon: BookOpen,
		color: 'neon-cyan',
	},
	{
		href: '/admin/daily',
		label: 'Daily Problem',
		desc: 'Set daily challenges',
		icon: CalendarDays,
		color: 'neon-cyan',
	},
	{
		href: '/admin/boss',
		label: 'Boss Battles',
		desc: 'Create boss battles',
		icon: Skull,
		color: 'neon-red',
	},
	{
		href: '/admin/quests',
		label: 'Quests',
		desc: 'Curate weekly quests',
		icon: ScrollText,
		color: 'neon-orange',
	},
	{
		href: '/admin/flashcards',
		label: 'Flashcards',
		desc: 'Upload & manage decks',
		icon: Layers,
		color: 'neon-magenta',
	},
	{
		href: '/admin/resources',
		label: 'Resources',
		desc: 'Approve/reject submissions',
		icon: BookOpen,
		color: 'neon-purple',
	},
	{
		href: '/admin/announcements',
		label: 'Announcements',
		desc: 'Create announcements',
		icon: Megaphone,
		color: 'neon-yellow',
	},
];

export default function AdminDashboardPage() {
	const { isAdmin } = useAuthContext();
	const [stats, setStats] = useState<PlatformStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch('/api/admin/stats');
				const data = await res.json();
				setStats(data.stats ?? null);
			} catch {
				/* silent */
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	if (!isAdmin) {
		return (
			<div className="text-center py-20">
				<Shield className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
				<p className="text-text-muted font-mono text-sm">Admin access required</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
			</div>
		);
	}

	const statCards = stats
		? [
				{ label: 'Users', value: stats.total_users, icon: Users, color: 'neon-cyan' },
				{
					label: 'CF Solves',
					value: stats.total_cf_solves.toLocaleString(),
					icon: Zap,
					color: 'neon-green',
				},
				{ label: 'Active Streaks', value: stats.active_streaks, icon: Flame, color: 'neon-orange' },
				{ label: 'Duels', value: stats.total_duels, icon: Swords, color: 'neon-red' },
				{
					label: 'Shared Problems',
					value: stats.shared_problems,
					icon: BookOpen,
					color: 'neon-purple',
				},
				{
					label: 'Resources',
					value: stats.approved_resources,
					icon: BookOpen,
					color: 'neon-magenta',
				},
				{ label: 'Boss Battles', value: stats.boss_battles, icon: Skull, color: 'neon-red' },
				{
					label: 'Total XP',
					value: stats.total_xp_awarded.toLocaleString(),
					icon: Zap,
					color: 'neon-yellow',
				},
				{ label: 'Avg Level', value: stats.average_level, icon: Shield, color: 'neon-cyan' },
			]
		: [];

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-225 mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-100 h-75 bg-neon-cyan/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-cyan pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-cyan">::</span> Admin Panel
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Platform Overview · Management Tools
				</p>
			</motion.header>

			{/* STATS */}
			{stats && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="card-brutal scifi-window p-0 overflow-hidden mb-8 relative group"
				>
					<div className="card-overlay" />
					<div className="corner-deco corner-tl" />
					<div className="corner-deco corner-tr" />
					<div className="corner-deco corner-bl" />
					<div className="corner-deco corner-br" />

					<div className="terminal-bar">
						<div className="flex items-center gap-3">
							<div className="traffic-lights">
								<div className="status-dot status-dot-red" />
								<div className="status-dot status-dot-yellow" />
								<div className="status-dot status-dot-green" />
							</div>
							<span className="scifi-label">:: Platform Stats</span>
						</div>
					</div>

					<div className="p-6 relative z-10">
						<div className="grid grid-cols-3 sm:grid-cols-3 divide-x divide-y divide-border-hard/20">
							{statCards.map((stat, i) => (
								<motion.div
									key={stat.label}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.15 + i * 0.03 }}
									className="p-4 text-center"
								>
									<stat.icon className={`w-4 h-4 text-${stat.color} opacity-50 mx-auto mb-1.5`} />
									<p className="font-mono text-2xl font-black text-text-primary tracking-tighter">
										{stat.value}
									</p>
									<p className="dash-sub mt-1">{stat.label}</p>
								</motion.div>
							))}
						</div>
					</div>
				</motion.div>
			)}

			{/* QUICK LINKS */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<h3 className="dash-heading mb-4">
					<Shield className="w-4 h-4 text-neon-cyan opacity-50" /> Admin Tools
				</h3>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{ADMIN_LINKS.map((link, i) => (
						<motion.div
							key={link.href}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.25 + i * 0.04 }}
						>
							<Link
								href={link.href}
								className={`card-brutal p-4 flex items-center gap-4 hover:border-${link.color}/40 transition-colors block`}
							>
								<div
									className={`w-10 h-10 flex items-center justify-center border border-${link.color}/30 bg-${link.color}/5`}
								>
									<link.icon className={`w-5 h-5 text-${link.color}`} />
								</div>
								<div className="min-w-0 flex-1">
									<h4 className="font-heading font-bold text-text-primary text-sm">{link.label}</h4>
									<p className="text-text-dim font-mono text-tiny">{link.desc}</p>
								</div>
							</Link>
						</motion.div>
					))}
				</div>
			</motion.div>
		</div>
	);
}
