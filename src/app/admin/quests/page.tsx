'use client';

import { motion } from 'framer-motion';
import { Plus, ScrollText, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { DateInput } from '@/components/ui/DatePicker';

interface Quest {
	id: number;
	title: string;
	description: string;
	quest_type: string;
	condition: Record<string, unknown>;
	xp_reward: number;
	week_start: string;
	is_admin_curated: boolean;
}

const QUEST_TYPES = ['topic', 'difficulty', 'streak', 'social', 'duel', 'study'];

function getMonday(date: Date): string {
	const d = new Date(date);
	const day = d.getDay();
	d.setDate(d.getDate() - ((day + 6) % 7));
	return d.toISOString().split('T')[0];
}

export default function AdminQuestsPage() {
	const { isAdmin } = useAuthContext();
	const [quests, setQuests] = useState<Quest[]>([]);
	const [loading, setLoading] = useState(true);
	const [weekStart, setWeekStart] = useState(getMonday(new Date()));

	// Form state
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [questType, setQuestType] = useState('topic');
	const [conditionTopic, setConditionTopic] = useState('dp');
	const [conditionCount, setConditionCount] = useState(3);
	const [xpReward, setXpReward] = useState(50);
	const [creating, setCreating] = useState(false);
	const [msg, setMsg] = useState('');

	async function loadQuests() {
		try {
			const res = await fetch('/api/quests/active');
			const data = await res.json();
			setQuests(data.quests ?? []);
		} catch (err) {
			console.error('[AdminQuests] Failed to fetch quests:', err);
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		loadQuests();
	}, []);

	const weekQuests = quests.filter((q) => q.week_start === weekStart);

	async function createQuest() {
		if (!title.trim() || !description.trim()) return;
		setCreating(true);
		setMsg('');

		const condition: Record<string, unknown> = {
			type:
				questType === 'topic'
					? 'solve_topic'
					: questType === 'difficulty'
						? 'solve_rating'
						: questType,
			count: conditionCount,
		};
		if (questType === 'topic') condition.topic = conditionTopic;

		try {
			const res = await fetch('/api/quests/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description,
					quest_type: questType,
					condition,
					xp_reward: xpReward,
					week_start: weekStart,
				}),
			});
			const data = await res.json();
			if (res.ok) {
				setMsg(`✅ Quest "${title}" created`);
				setTitle('');
				setDescription('');
				loadQuests();
			} else {
				setMsg(`❌ ${data.error}`);
			}
		} catch {
			setMsg('❌ Failed to create quest');
		} finally {
			setCreating(false);
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
				<div className="w-10 h-10 border-2 border-neon-orange/20 border-t-neon-orange animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-200 mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-75 bg-neon-orange/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-orange pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-orange">::</span> Curate Quests
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Create weekly quests for the class
				</p>
			</motion.header>

			{/* WEEK SELECTOR */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="flex items-center gap-3 mb-6"
			>
				<label htmlFor="week-select" className="form-label">
					Week Starting
				</label>
				<DateInput
					id="week-select"
					value={weekStart}
					onChange={(v) => setWeekStart(v)}
					futureOnly
					className="py-2 text-sm w-48"
				/>
				<span className="dash-sub">{weekQuests.length} quests this week</span>
			</motion.div>

			{/* CREATE QUEST FORM */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.15 }}
				className="card-brutal scifi-window p-0 overflow-hidden mb-8 relative group"
			>
				<div className="card-overlay" />
				<div
					className="corner-deco corner-tl"
					style={{ borderColor: 'var(--color-neon-orange)' }}
				/>
				<div
					className="corner-deco corner-tr"
					style={{ borderColor: 'var(--color-neon-orange)' }}
				/>
				<div
					className="corner-deco corner-bl"
					style={{ borderColor: 'var(--color-neon-orange)' }}
				/>
				<div
					className="corner-deco corner-br"
					style={{ borderColor: 'var(--color-neon-orange)' }}
				/>

				<div className="terminal-bar">
					<div className="flex items-center gap-3">
						<div className="traffic-lights">
							<div className="status-dot status-dot-red" />
							<div className="status-dot status-dot-yellow" />
							<div className="status-dot status-dot-green" />
						</div>
						<span className="scifi-label" style={{ color: 'var(--color-neon-orange)' }}>
							:: New Quest
						</span>
					</div>
				</div>

				<div className="p-6 relative z-10 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label htmlFor="quest-title" className="form-label mb-1.5 block">
								Title *
							</label>
							<input
								id="quest-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder='e.g. "Solve 3 DP problems"'
								className="form-input py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="quest-type" className="form-label mb-1.5 block">
								Type
							</label>
							<select
								id="quest-type"
								value={questType}
								onChange={(e) => setQuestType(e.target.value)}
								className="form-input py-2.5 text-sm"
							>
								{QUEST_TYPES.map((t) => (
									<option key={t} value={t}>
										{t.charAt(0).toUpperCase() + t.slice(1)}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label htmlFor="quest-desc" className="form-label mb-1.5 block">
							Description *
						</label>
						<input
							id="quest-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What students need to do"
							className="form-input py-2.5 text-sm"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{questType === 'topic' && (
							<div>
								<label htmlFor="quest-topic" className="form-label mb-1.5 block">
									Topic
								</label>
								<input
									id="quest-topic"
									value={conditionTopic}
									onChange={(e) => setConditionTopic(e.target.value)}
									placeholder="dp, graphs, etc."
									className="form-input py-2.5 text-sm"
								/>
							</div>
						)}
						<div>
							<label htmlFor="quest-count" className="form-label mb-1.5 block">
								Required Count
							</label>
							<input
								id="quest-count"
								type="number"
								min={1}
								value={conditionCount}
								onChange={(e) => setConditionCount(Number(e.target.value))}
								className="form-input py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="quest-xp" className="form-label mb-1.5 block">
								XP Reward
							</label>
							<input
								id="quest-xp"
								type="number"
								min={10}
								value={xpReward}
								onChange={(e) => setXpReward(Number(e.target.value))}
								className="form-input py-2.5 text-sm"
							/>
						</div>
					</div>

					{msg && <p className="font-mono text-sm text-text-secondary">{msg}</p>}

					<button
						type="button"
						onClick={createQuest}
						disabled={!title.trim() || !description.trim() || creating}
						className="btn-neon px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
						style={{
							background: 'var(--color-neon-orange)',
							borderColor: '#000',
						}}
					>
						<Plus className="w-4 h-4" />
						{creating ? 'Creating...' : 'Create Quest'}
					</button>
				</div>
			</motion.div>

			{/* EXISTING QUESTS THIS WEEK */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.25 }}
			>
				<h3 className="dash-heading mb-4">
					<ScrollText className="w-4 h-4 text-neon-orange opacity-50" />
					Quests for {weekStart} ({weekQuests.length})
				</h3>

				{weekQuests.length === 0 ? (
					<p className="text-text-dim font-mono text-sm">
						No quests for this week. Create one above or wait for auto-generation on Monday.
					</p>
				) : (
					<div className="space-y-2">
						{weekQuests.map((quest) => (
							<div key={quest.id} className="card-brutal p-4 flex items-center gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-0.5">
										<h4 className="font-heading font-bold text-text-primary truncate">
											{quest.title}
										</h4>
										<span className="px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-neon-orange/30 text-neon-orange">
											{quest.quest_type}
										</span>
										{quest.is_admin_curated && (
											<span className="px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-neon-magenta/30 text-neon-magenta">
												curated
											</span>
										)}
									</div>
									<p className="text-text-secondary text-sm font-mono truncate">
										{quest.description}
									</p>
									<span className="dash-sub">+{quest.xp_reward} XP</span>
								</div>

								<button
									type="button"
									onClick={async () => {
										if (!confirm('Delete this quest?')) return;
										try {
											const res = await fetch(`/api/quests/${quest.id}`, { method: 'DELETE' });
											if (res.ok) {
												setMsg(`✅ Quest "${quest.title}" deleted`);
												loadQuests();
											} else {
												const data = await res.json();
												setMsg(`❌ ${data.error}`);
											}
										} catch {
											setMsg('❌ Failed to delete quest');
										}
									}}
									className="p-2 border border-border-hard text-text-muted hover:text-neon-red hover:border-neon-red/40 transition-colors"
									title="Delete"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				)}
			</motion.div>
		</div>
	);
}
