'use client';

import { motion } from 'framer-motion';
import { CalendarDays, ExternalLink, Plus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { DateInput } from '@/components/ui/DatePicker';

interface DailyProblem {
	id: number;
	date: string;
	problem_id: string;
	problem_name: string;
	problem_rating: number | null;
	problem_url: string;
	tags: string[];
	is_admin_curated: boolean;
	created_at: string;
}

export default function AdminDailyPage() {
	const { isAdmin } = useAuthContext();
	const [dailies, setDailies] = useState<DailyProblem[]>([]);
	const [loading, setLoading] = useState(true);

	// Form state
	const [date, setDate] = useState(() => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
	});
	const [cfUrl, setCfUrl] = useState('');
	const [problemName, setProblemName] = useState('');
	const [problemRating, setProblemRating] = useState('');
	const [tagsInput, setTagsInput] = useState('');
	const [creating, setCreating] = useState(false);
	const [msg, setMsg] = useState('');

	async function loadDailies() {
		try {
			const res = await fetch('/api/admin/daily');
			const data = await res.json();
			setDailies(data.dailies ?? []);
		} catch (err) {
			console.error('[AdminDaily] Failed to fetch daily problems:', err);
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		loadDailies();
	}, []);

	// Parse Codeforces URL into problem_id
	function parseCfUrl(url: string): {
		problem_id: string;
		problem_url: string;
	} | null {
		// Formats:
		// https://codeforces.com/problemset/problem/1234/A
		// https://codeforces.com/contest/1234/problem/A
		const match1 = url.match(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Z]\d*)/);
		const match2 = url.match(/codeforces\.com\/contest\/(\d+)\/problem\/([A-Z]\d*)/);
		const match = match1 || match2;
		if (match) {
			return {
				problem_id: `${match[1]}${match[2]}`,
				problem_url: `https://codeforces.com/problemset/problem/${match[1]}/${match[2]}`,
			};
		}
		// Raw problem ID like "1234A"
		const rawMatch = url.match(/^(\d+)([A-Z]\d*)$/);
		if (rawMatch) {
			return {
				problem_id: url,
				problem_url: `https://codeforces.com/problemset/problem/${rawMatch[1]}/${rawMatch[2]}`,
			};
		}
		return null;
	}

	async function handleCreate() {
		if (!date || !cfUrl.trim() || !problemName.trim()) return;
		setCreating(true);
		setMsg('');

		const parsed = parseCfUrl(cfUrl.trim());
		if (!parsed) {
			setMsg('❌ Invalid CF URL or problem ID. Use URL or format like "1234A"');
			setCreating(false);
			return;
		}

		const tags = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		try {
			const res = await fetch('/api/admin/daily', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date,
					problem_id: parsed.problem_id,
					problem_name: problemName.trim(),
					problem_rating: problemRating ? Number.parseInt(problemRating, 10) : null,
					problem_url: parsed.problem_url,
					tags,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				setMsg(
					data.updated
						? `✅ Updated daily for ${date}`
						: `✅ Set "${problemName}" as daily for ${date}`,
				);
				setCfUrl('');
				setProblemName('');
				setProblemRating('');
				setTagsInput('');
				loadDailies();
			} else {
				setMsg(`❌ ${data.error}`);
			}
		} catch {
			setMsg('❌ Failed to set daily problem');
		} finally {
			setCreating(false);
		}
	}

	const today = new Date().toISOString().split('T')[0];

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
					<span className="text-neon-cyan">::</span> Set Daily Problem
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Curate the daily challenge · Can be set days in advance
				</p>
			</motion.header>

			{/* SET DAILY FORM */}
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
						<span className="scifi-label">:: Set Daily Problem</span>
					</div>
				</div>

				<div className="p-6 relative z-10 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label htmlFor="daily-date" className="form-label mb-1.5 block">
								Date *
							</label>
							<DateInput
								id="daily-date"
								value={date}
								onChange={(v) => setDate(v)}
								futureOnly
								className="py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="daily-url" className="form-label mb-1.5 block">
								CF URL or Problem ID *
							</label>
							<input
								id="daily-url"
								value={cfUrl}
								onChange={(e) => setCfUrl(e.target.value)}
								placeholder="1234A or codeforces.com/..."
								className="form-input py-2.5 text-sm"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label htmlFor="daily-name" className="form-label mb-1.5 block">
								Problem Name *
							</label>
							<input
								id="daily-name"
								value={problemName}
								onChange={(e) => setProblemName(e.target.value)}
								placeholder='e.g. "Dijkstra?"'
								className="form-input py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="daily-rating" className="form-label mb-1.5 block">
								Rating (optional)
							</label>
							<input
								id="daily-rating"
								type="number"
								value={problemRating}
								onChange={(e) => setProblemRating(e.target.value)}
								placeholder="1500"
								className="form-input py-2.5 text-sm"
							/>
						</div>
					</div>

					<div>
						<label htmlFor="daily-tags" className="form-label mb-1.5 block">
							Tags (comma-separated)
						</label>
						<input
							id="daily-tags"
							value={tagsInput}
							onChange={(e) => setTagsInput(e.target.value)}
							placeholder="dp, graphs, greedy"
							className="form-input py-2.5 text-sm"
						/>
					</div>

					{msg && <p className="font-mono text-sm text-text-secondary">{msg}</p>}

					<button
						type="button"
						onClick={handleCreate}
						disabled={!date || !cfUrl.trim() || !problemName.trim() || creating}
						className="btn-neon px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						<Plus className="w-4 h-4" />
						{creating ? 'Setting...' : 'Set Daily Problem'}
					</button>
				</div>
			</motion.div>

			{/* UPCOMING/RECENT DAILIES */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<h3 className="dash-heading mb-4">
					<CalendarDays className="w-4 h-4 text-neon-cyan opacity-50" /> Schedule ({dailies.length})
				</h3>

				{dailies.length === 0 ? (
					<p className="text-text-dim font-mono text-sm">
						No daily problems scheduled. Set one above or let the auto-generator handle it.
					</p>
				) : (
					<div className="space-y-2">
						{dailies.map((dp) => {
							const isToday = dp.date === today;
							const isFuture = dp.date > today;
							const isPast = dp.date < today;

							return (
								<div
									key={dp.id}
									className={`card-brutal p-4 flex items-center gap-4 ${
										isToday ? 'border-neon-green/40' : isFuture ? 'border-neon-cyan/20' : ''
									}`}
								>
									{/* Date */}
									<div className={`text-center min-w-[52px] ${isPast ? 'opacity-50' : ''}`}>
										<p className="font-mono text-lg font-black text-text-primary leading-none">
											{new Date(`${dp.date}T00:00`).getDate()}
										</p>
										<p className="font-mono text-micro uppercase text-text-dim">
											{new Date(`${dp.date}T00:00`).toLocaleDateString('en-US', {
												weekday: 'short',
											})}
										</p>
									</div>

									<div className="h-8 w-px bg-border-hard" />

									{/* Problem info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span
												className={`font-heading font-bold text-text-primary truncate ${isPast ? 'opacity-50' : ''}`}
											>
												{dp.problem_name}
											</span>
											{isToday && (
												<span className="px-2 py-0.5 bg-neon-green/10 border border-neon-green/30 text-neon-green font-mono text-micro uppercase font-bold">
													Today
												</span>
											)}
											{isFuture && (
												<span className="px-2 py-0.5 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-micro uppercase font-bold">
													Scheduled
												</span>
											)}
											{dp.is_admin_curated && <Sparkles className="w-3 h-3 text-neon-magenta" />}
										</div>
										<div className="flex items-center gap-2 mt-0.5">
											<span className="dash-sub">{dp.problem_id}</span>
											{dp.problem_rating && <span className="dash-sub">R{dp.problem_rating}</span>}
											{dp.tags.length > 0 && (
												<div className="flex gap-1">
													{dp.tags.slice(0, 3).map((t) => (
														<span
															key={t}
															className="px-1.5 py-0.5 bg-neon-cyan/5 border border-neon-cyan/20 text-neon-cyan font-mono text-micro uppercase"
														>
															{t}
														</span>
													))}
												</div>
											)}
										</div>
									</div>

									<a
										href={dp.problem_url}
										target="_blank"
										rel="noopener noreferrer"
										className="p-2 border border-border-hard text-text-muted hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors"
									>
										<ExternalLink className="w-4 h-4" />
									</a>
								</div>
							);
						})}
					</div>
				)}
			</motion.div>
		</div>
	);
}
