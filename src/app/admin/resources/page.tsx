'use client';

import { motion } from 'framer-motion';
import { BookOpen, Check, Clock, ExternalLink, FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface Resource {
	id: number;
	title: string;
	url: string;
	description: string | null;
	topic: string;
	status: 'pending' | 'approved' | 'rejected';
	created_at: string;
	profiles?: { display_name: string } | null;
}

export default function AdminResourcesPage() {
	const { isAdmin } = useAuthContext();
	const [pending, setPending] = useState<Resource[]>([]);
	const [approved, setApproved] = useState<Resource[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionMsg, setActionMsg] = useState('');

	async function loadData() {
		try {
			const [pendingRes, approvedRes] = await Promise.all([
				fetch('/api/resources/pending'),
				fetch('/api/resources/list'),
			]);
			const pendingData = await pendingRes.json();
			const approvedData = await approvedRes.json();
			setPending(pendingData.resources ?? []);
			setApproved(approvedData.resources ?? []);
		} catch (err) {
			console.error('[AdminResources] Failed to fetch resources:', err);
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		loadData();
	}, []);

	async function handleReview(resourceId: number, action: 'approve' | 'reject') {
		setActionMsg('');
		try {
			const res = await fetch(`/api/resources/${resourceId}/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action }),
			});
			const data = await res.json();
			if (res.ok) {
				setActionMsg(
					action === 'approve'
						? `✅ Resource approved! Submitter earned XP.`
						: `❌ Resource rejected.`,
				);
				loadData();
			} else {
				setActionMsg(`❌ ${data.error}`);
			}
		} catch {
			setActionMsg('❌ Failed to review resource');
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
				<div className="w-10 h-10 border-2 border-neon-purple/20 border-t-neon-purple animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[800px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-purple/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-purple pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-purple">::</span> Resource Review
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Approve or reject student submissions
				</p>
			</motion.header>

			{actionMsg && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="font-mono text-sm text-text-secondary mb-4 px-3 py-2 border border-border-hard"
				>
					{actionMsg}
				</motion.p>
			)}

			{/* PENDING */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="mb-8"
			>
				<h3 className="dash-heading mb-4">
					<FileText className="w-4 h-4 text-neon-purple opacity-50" /> Pending Review (
					{pending.length})
				</h3>

				{pending.length === 0 ? (
					<p className="text-text-dim font-mono text-sm">No pending resources. All caught up! 🎉</p>
				) : (
					<div className="space-y-2">
						{pending.map((resource, i) => (
							<motion.div
								key={resource.id}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.15 + i * 0.04 }}
								className="card-brutal p-4 border-neon-yellow/20"
							>
								<div className="flex items-start gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h4 className="font-heading font-bold text-text-primary truncate">
												{resource.title}
											</h4>
											<span className="px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-neon-purple/30 text-neon-purple">
												{resource.topic}
											</span>
										</div>
										{resource.description && (
											<p className="text-text-secondary text-sm font-mono line-clamp-2 mb-1.5">
												{resource.description}
											</p>
										)}
										<div className="flex items-center gap-3 flex-wrap">
											<a
												href={resource.url}
												target="_blank"
												rel="noopener noreferrer"
												className="text-neon-cyan text-sm font-mono flex items-center gap-1 hover:underline"
											>
												<ExternalLink className="w-3 h-3" />{' '}
												{resource.url.length > 50
													? `${resource.url.slice(0, 50)}...`
													: resource.url}
											</a>
											{resource.profiles?.display_name && (
												<span className="dash-sub">by {resource.profiles.display_name}</span>
											)}
											<span className="dash-sub flex items-center gap-1">
												<Clock className="w-3 h-3" />
												{new Date(resource.created_at).toLocaleDateString('en-IN', {
													day: 'numeric',
													month: 'short',
												})}
											</span>
										</div>
									</div>

									<div className="flex gap-2 shrink-0">
										<button
											type="button"
											onClick={() => handleReview(resource.id, 'approve')}
											className="p-2 border border-neon-green/30 text-neon-green hover:bg-neon-green/10 transition-colors"
											title="Approve"
										>
											<Check className="w-4 h-4" />
										</button>
										<button
											type="button"
											onClick={() => handleReview(resource.id, 'reject')}
											className="p-2 border border-neon-red/30 text-neon-red hover:bg-neon-red/10 transition-colors"
											title="Reject"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				)}
			</motion.div>

			{/* APPROVED */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<h3 className="dash-heading mb-4">
					<BookOpen className="w-4 h-4 text-neon-green opacity-50" /> Approved ({approved.length})
				</h3>

				{approved.length === 0 ? (
					<p className="text-text-dim font-mono text-sm">No approved resources yet.</p>
				) : (
					<div className="space-y-2">
						{approved.map((resource) => (
							<div key={resource.id} className="card-brutal p-4 flex items-center gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-0.5">
										<h4 className="font-heading font-bold text-text-primary truncate">
											{resource.title}
										</h4>
										<span className="px-1.5 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-neon-purple/20 text-neon-purple">
											{resource.topic}
										</span>
									</div>
									{resource.description && (
										<p className="text-text-secondary text-sm font-mono truncate">
											{resource.description}
										</p>
									)}
								</div>
								<a
									href={resource.url}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2 border border-border-hard text-text-muted hover:text-neon-cyan hover:border-neon-cyan/40 transition-colors shrink-0"
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
