'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Megaphone, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface Announcement {
	id: number;
	title: string;
	body: string;
	priority: 'normal' | 'important' | 'urgent';
	created_at: string;
}

const PRIORITY_STYLES: Record<string, { border: string; text: string; bg: string; label: string }> =
	{
		urgent: {
			border: 'border-neon-red/50',
			text: 'text-neon-red',
			bg: 'bg-neon-red/5',
			label: 'URGENT',
		},
		important: {
			border: 'border-neon-orange/50',
			text: 'text-neon-orange',
			bg: 'bg-neon-orange/5',
			label: 'IMPORTANT',
		},
		normal: { border: 'border-border-hard', text: 'text-text-muted', bg: '', label: 'NORMAL' },
	};

export default function AdminAnnouncementsPage() {
	const { isAdmin } = useAuthContext();
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [loading, setLoading] = useState(true);

	// Form state
	const [title, setTitle] = useState('');
	const [body, setBody] = useState('');
	const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
	const [creating, setCreating] = useState(false);
	const [msg, setMsg] = useState('');

	async function loadAnnouncements() {
		try {
			const res = await fetch('/api/announcements/list');
			const data = await res.json();
			setAnnouncements(data.announcements ?? []);
		} catch (err) {
			console.error('[AdminAnnouncements] Failed to fetch announcements:', err);
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		loadAnnouncements();
	}, []);

	async function handleCreate() {
		if (!title.trim() || !body.trim()) return;
		setCreating(true);
		setMsg('');

		try {
			const res = await fetch('/api/announcements/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, body, priority }),
			});
			const data = await res.json();
			if (res.ok) {
				setMsg(`✅ Announcement "${title}" published & notifications sent`);
				setTitle('');
				setBody('');
				setPriority('normal');
				loadAnnouncements();
			} else {
				setMsg(`❌ ${data.error}`);
			}
		} catch {
			setMsg('❌ Failed to create announcement');
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
				<div className="w-10 h-10 border-2 border-neon-yellow/20 border-t-neon-yellow animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[800px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-yellow/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-yellow pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-yellow">::</span> Announcements
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Broadcast to all students · Push notifications
				</p>
			</motion.header>

			{/* CREATE FORM */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="card-brutal scifi-window p-0 overflow-hidden mb-8 relative group"
			>
				<div className="card-overlay" />
				<div
					className="corner-deco corner-tl"
					style={{ borderColor: 'var(--color-neon-yellow)' }}
				/>
				<div
					className="corner-deco corner-tr"
					style={{ borderColor: 'var(--color-neon-yellow)' }}
				/>
				<div
					className="corner-deco corner-bl"
					style={{ borderColor: 'var(--color-neon-yellow)' }}
				/>
				<div
					className="corner-deco corner-br"
					style={{ borderColor: 'var(--color-neon-yellow)' }}
				/>

				<div className="terminal-bar">
					<div className="flex items-center gap-3">
						<div className="traffic-lights">
							<div className="status-dot status-dot-red" />
							<div className="status-dot status-dot-yellow" />
							<div className="status-dot status-dot-green" />
						</div>
						<span className="scifi-label" style={{ color: 'var(--color-neon-yellow)' }}>
							:: New Announcement
						</span>
					</div>
				</div>

				<div className="p-6 relative z-10 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label htmlFor="ann-title" className="form-label mb-1.5 block">
								Title *
							</label>
							<input
								id="ann-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Contest this Saturday!"
								className="form-input py-2.5 text-sm"
							/>
						</div>
						<div>
							<label htmlFor="ann-priority" className="form-label mb-1.5 block">
								Priority
							</label>
							<select
								id="ann-priority"
								value={priority}
								onChange={(e) => setPriority(e.target.value as 'normal' | 'important' | 'urgent')}
								className="form-input py-2.5 text-sm"
							>
								<option value="normal">Normal</option>
								<option value="important">Important</option>
								<option value="urgent">Urgent</option>
							</select>
						</div>
					</div>

					<div>
						<label htmlFor="ann-body" className="form-label mb-1.5 block">
							Body *
						</label>
						<textarea
							id="ann-body"
							value={body}
							onChange={(e) => setBody(e.target.value)}
							placeholder="Write your announcement... (supports markdown)"
							rows={5}
							className="form-input py-2.5 text-sm font-mono resize-y"
						/>
					</div>

					{msg && <p className="font-mono text-sm text-text-secondary">{msg}</p>}

					<button
						type="button"
						onClick={handleCreate}
						disabled={!title.trim() || !body.trim() || creating}
						className="btn-neon px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
						style={{ background: 'var(--color-neon-yellow)', borderColor: '#000' }}
					>
						<Plus className="w-4 h-4" />
						{creating ? 'Publishing...' : 'Publish Announcement'}
					</button>
				</div>
			</motion.div>

			{/* EXISTING ANNOUNCEMENTS */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<h3 className="dash-heading mb-4">
					<Megaphone className="w-4 h-4 text-neon-yellow opacity-50" /> Recent (
					{announcements.length})
				</h3>

				{announcements.length === 0 ? (
					<p className="text-text-dim font-mono text-sm">No announcements yet.</p>
				) : (
					<div className="space-y-2">
						{announcements.map((ann) => {
							const pStyle = PRIORITY_STYLES[ann.priority] ?? PRIORITY_STYLES.normal;
							return (
								<div key={ann.id} className={`card-brutal p-4 ${pStyle.border} ${pStyle.bg}`}>
									<div className="flex items-start gap-3">
										{ann.priority === 'urgent' && (
											<AlertTriangle className="w-4 h-4 text-neon-red shrink-0 mt-0.5" />
										)}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<h4 className="font-heading font-bold text-text-primary truncate">
													{ann.title}
												</h4>
												{ann.priority !== 'normal' && (
													<span
														className={`px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border ${pStyle.border} ${pStyle.text}`}
													>
														{pStyle.label}
													</span>
												)}
											</div>
											<p className="text-text-secondary text-sm font-mono line-clamp-2">
												{ann.body}
											</p>
											<div className="flex items-center gap-1.5 mt-2">
												<Clock className="w-3 h-3 text-text-dim" />
												<span className="dash-sub">
													{new Date(ann.created_at).toLocaleDateString('en-IN', {
														day: 'numeric',
														month: 'short',
														year: 'numeric',
														hour: '2-digit',
														minute: '2-digit',
													})}
												</span>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</motion.div>
		</div>
	);
}
