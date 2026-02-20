'use client';

import { motion } from 'framer-motion';
import { Clock, ExternalLink, Plus, Skull, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { DateTimeInput } from '@/components/ui/DatePicker';

interface BossBattle {
	id: number;
	title: string;
	description: string | null;
	problem_url: string;
	problem_id: string | null;
	difficulty_label: string | null;
	xp_first: number;
	xp_top5: number;
	xp_others: number;
	starts_at: string;
	ends_at: string;
	created_at: string;
}

const DIFFICULTY_OPTIONS = ['Nightmare', 'Brutal', 'Legendary', 'Extreme', 'Hellfire'];

export default function AdminBossPage() {
	const { isAdmin } = useAuthContext();
	const [activeBoss, setActiveBoss] = useState<BossBattle | null>(null);
	const [archive, setArchive] = useState<BossBattle[]>([]);
	const [loading, setLoading] = useState(true);

	// Form state
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [problemUrl, setProblemUrl] = useState('');
	const [difficultyLabel, setDifficultyLabel] = useState('Brutal');
	const [xpFirst, setXpFirst] = useState(500);
	const [xpTop5, setXpTop5] = useState(300);
	const [xpOthers, setXpOthers] = useState(150);
	const [startsAt, setStartsAt] = useState('');
	const [endsAt, setEndsAt] = useState('');
	const [creating, setCreating] = useState(false);
	const [msg, setMsg] = useState('');

	async function loadData() {
		try {
			const [activeRes, archiveRes] = await Promise.all([
				fetch('/api/boss/active'),
				fetch('/api/boss/archive'),
			]);
			const activeData = await activeRes.json();
			const archiveData = await archiveRes.json();
			setActiveBoss(activeData.boss ?? null);
			setArchive(archiveData.battles ?? []);
		} catch (err) {
			console.error('[AdminBoss] Failed to fetch boss data:', err);
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		loadData();
	}, []);

	async function handleCreate() {
		if (!title.trim() || !problemUrl.trim() || !startsAt || !endsAt) return;
		if (!problemUrl.includes('codeforces.com/')) {
			setMsg('❌ Please enter a valid Codeforces problem URL');
			return;
		}

		setCreating(true);
		setMsg('');

		try {
			const res = await fetch('/api/boss/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description: description || null,
					problem_url: problemUrl,
					difficulty_label: difficultyLabel,
					xp_first: xpFirst,
					xp_top5: xpTop5,
					xp_others: xpOthers,
					starts_at: new Date(startsAt).toISOString(),
					ends_at: new Date(endsAt).toISOString(),
				}),
			});
			const data = await res.json();
			if (res.ok) {
				setMsg(`✅ Boss Battle "${title}" created! Notifications sent.`);
				setTitle('');
				setDescription('');
				setProblemUrl('');
				setStartsAt('');
				setEndsAt('');
				loadData();
			} else {
				setMsg(`❌ ${data.error}`);
			}
		} catch {
			setMsg('❌ Failed to create boss battle');
		} finally {
			setCreating(false);
		}
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-IN', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
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
				<div className="w-10 h-10 border-2 border-neon-red/20 border-t-neon-red animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[800px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-red/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-red pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-red">::</span> Boss Battles
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Create epic boss challenges · Track class-wide progress
				</p>
			</motion.header>

			{/* ACTIVE BOSS */}
			{activeBoss && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.05 }}
					className="card-brutal p-4 border-neon-red/40 mb-6"
				>
					<div className="flex items-center gap-2 mb-2">
						<Skull className="w-4 h-4 text-neon-red" />
						<span className="font-mono text-micro uppercase tracking-widest font-bold text-neon-red">
							Currently Active
						</span>
					</div>
					<h4 className="font-heading font-bold text-text-primary text-lg">{activeBoss.title}</h4>
					{activeBoss.description && (
						<p className="text-text-secondary text-sm font-mono mt-1">{activeBoss.description}</p>
					)}
					<div className="flex items-center gap-4 mt-2 flex-wrap">
						{activeBoss.difficulty_label && (
							<span className="px-1.5 py-0.5 font-mono text-micro uppercase font-bold border border-neon-red/30 text-neon-red">
								{activeBoss.difficulty_label}
							</span>
						)}
						<span className="dash-sub">
							{formatDate(activeBoss.starts_at)} → {formatDate(activeBoss.ends_at)}
						</span>
						<a
							href={activeBoss.problem_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-neon-cyan text-sm font-mono flex items-center gap-1 hover:underline"
						>
							<ExternalLink className="w-3 h-3" /> Problem
						</a>
					</div>
				</motion.div>
			)}

			{/* CREATE FORM */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="card-brutal scifi-window p-0 overflow-hidden mb-8 relative group"
			>
				<div className="card-overlay" />
				<div className="corner-deco corner-tl" style={{ borderColor: 'var(--color-neon-red)' }} />
				<div className="corner-deco corner-tr" style={{ borderColor: 'var(--color-neon-red)' }} />
				<div className="corner-deco corner-bl" style={{ borderColor: 'var(--color-neon-red)' }} />
				<div className="corner-deco corner-br" style={{ borderColor: 'var(--color-neon-red)' }} />

				<div className="terminal-bar">
					<div className="flex items-center gap-3">
						<div className="traffic-lights">
							<div className="status-dot status-dot-red" />
							<div className="status-dot status-dot-yellow" />
							<div className="status-dot status-dot-green" />
						</div>
						<span className="scifi-label" style={{ color: 'var(--color-neon-red)' }}>
							:: Create Boss Battle
						</span>
					</div>
				</div>

				<div className="p-6 relative z-10 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label htmlFor="boss-title" className="form-label mb-1.5 block">
								Title *
							</label>
							<input
								id="boss-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder='e.g. "Tree of Despair"'
								className="form-input py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="boss-diff" className="form-label mb-1.5 block">
								Difficulty
							</label>
							<select
								id="boss-diff"
								value={difficultyLabel}
								onChange={(e) => setDifficultyLabel(e.target.value)}
								className="form-input py-2.5 text-sm"
							>
								{DIFFICULTY_OPTIONS.map((d) => (
									<option key={d} value={d}>
										{d}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label htmlFor="boss-desc" className="form-label mb-1.5 block">
							Description
						</label>
						<textarea
							id="boss-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe the challenge..."
							rows={3}
							className="form-input py-2.5 text-sm font-mono resize-y"
						/>
					</div>

					<div>
						<label htmlFor="boss-url" className="form-label mb-1.5 block">
							Problem URL *
						</label>
						<input
							id="boss-url"
							value={problemUrl}
							onChange={(e) => setProblemUrl(e.target.value)}
							placeholder="https://codeforces.com/problemset/problem/1234/A"
							className="form-input py-2.5 text-sm"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label htmlFor="boss-start" className="form-label mb-1.5 block">
								Starts At *
							</label>
							<DateTimeInput
								id="boss-start"
								value={startsAt}
								onChange={(v) => setStartsAt(v)}
								futureOnly
								className="py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="boss-end" className="form-label mb-1.5 block">
								Ends At *
							</label>
							<DateTimeInput
								id="boss-end"
								value={endsAt}
								onChange={(v) => setEndsAt(v)}
								futureOnly
								className="py-2.5 text-sm"
							/>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div>
							<label htmlFor="xp-first" className="form-label mb-1.5 block">
								XP (1st)
							</label>
							<input
								id="xp-first"
								type="number"
								value={xpFirst}
								onChange={(e) => setXpFirst(Number(e.target.value))}
								className="form-input py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="xp-top5" className="form-label mb-1.5 block">
								XP (Top 5)
							</label>
							<input
								id="xp-top5"
								type="number"
								value={xpTop5}
								onChange={(e) => setXpTop5(Number(e.target.value))}
								className="form-input py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="xp-others" className="form-label mb-1.5 block">
								XP (Others)
							</label>
							<input
								id="xp-others"
								type="number"
								value={xpOthers}
								onChange={(e) => setXpOthers(Number(e.target.value))}
								className="form-input py-2.5 text-sm"
							/>
						</div>
					</div>

					{msg && <p className="font-mono text-sm text-text-secondary">{msg}</p>}

					<button
						type="button"
						onClick={handleCreate}
						disabled={!title.trim() || !problemUrl.trim() || !startsAt || !endsAt || creating}
						className="btn-neon px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
						style={{ background: 'var(--color-neon-red)', borderColor: '#000' }}
					>
						<Plus className="w-4 h-4" />
						{creating ? 'Creating...' : 'Launch Boss Battle'}
					</button>
				</div>
			</motion.div>

			{/* ARCHIVE */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<h3 className="dash-heading mb-4">
					<Trophy className="w-4 h-4 text-neon-red opacity-50" /> Archive ({archive.length})
				</h3>

				{archive.length === 0 ? (
					<p className="text-text-dim font-mono text-sm">No past boss battles.</p>
				) : (
					<div className="space-y-2">
						{archive.map((boss) => (
							<div key={boss.id} className="card-brutal p-4 flex items-center gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-0.5">
										<h4 className="font-heading font-bold text-text-primary truncate">
											{boss.title}
										</h4>
										{boss.difficulty_label && (
											<span className="px-1.5 py-0.5 font-mono text-micro uppercase font-bold border border-neon-red/30 text-neon-red">
												{boss.difficulty_label}
											</span>
										)}
									</div>
									<div className="flex items-center gap-3 mt-0.5">
										<span className="dash-sub flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{formatDate(boss.starts_at)} → {formatDate(boss.ends_at)}
										</span>
									</div>
								</div>
								<a
									href={boss.problem_url}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2 border border-border-hard text-text-muted hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors"
								>
									<ExternalLink className="w-4 h-4" />
								</a>
							</div>
						))}
					</div>
				)}
			</motion.div>
		</div>
	);
}
