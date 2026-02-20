'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { useState } from 'react';

const TOPICS = [
	'dp',
	'graphs',
	'greedy',
	'math',
	'strings',
	'trees',
	'data_structures',
	'number_theory',
	'geometry',
	'sorting',
	'binary_search',
	'segment_trees',
	'implementation',
	'general',
];

interface SubmitResourceModalProps {
	open: boolean;
	onClose: () => void;
	onSubmitted: () => void;
}

export function SubmitResourceModal({ open, onClose, onSubmitted }: SubmitResourceModalProps) {
	const [title, setTitle] = useState('');
	const [url, setUrl] = useState('');
	const [description, setDescription] = useState('');
	const [topic, setTopic] = useState('general');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim() || !url.trim()) {
			setError('Title and URL are required');
			return;
		}

		setSubmitting(true);
		setError('');

		try {
			const res = await fetch('/api/resources/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					url: url.trim(),
					description: description.trim() || null,
					topic,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error ?? 'Failed to submit');
				return;
			}

			setSuccess(true);
			setTimeout(() => {
				setTitle('');
				setUrl('');
				setDescription('');
				setTopic('general');
				setSuccess(false);
				onSubmitted();
				onClose();
			}, 1500);
		} catch {
			setError('Network error');
		} finally {
			setSubmitting(false);
		}
	}

	function formatTopicLabel(t: string) {
		return t.replace(/_/g, ' ');
	}

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm"
					onClick={onClose}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						onClick={(e) => e.stopPropagation()}
						className="card-brutal scifi-window p-0 overflow-hidden relative w-full max-w-md"
					>
						<div className="card-overlay" />

						{/* Header */}
						<div className="terminal-bar">
							<div className="flex items-center gap-3">
								<div className="traffic-lights">
									<div className="status-dot status-dot-red" />
									<div className="status-dot status-dot-yellow" />
									<div className="status-dot status-dot-green" />
								</div>
								<h3 className="scifi-label">:: Submit Resource</h3>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="text-text-dim hover:text-text-primary transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Body */}
						<div className="p-6 relative z-10">
							{success ? (
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									className="text-center py-8"
								>
									<CheckCircle2 className="w-12 h-12 text-neon-green mx-auto mb-3" />
									<p className="font-mono text-sm text-neon-green font-bold">
										Submitted for review!
									</p>
									<p className="text-text-dim font-mono text-tiny mt-1">
										An admin will review your resource
									</p>
								</motion.div>
							) : (
								<form onSubmit={handleSubmit} className="space-y-4">
									<div>
										<label htmlFor="res-title" className="form-label">
											Title
										</label>
										<input
											id="res-title"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											placeholder="e.g., CP Algorithms: Segment Trees"
											className="form-input text-sm"
										/>
									</div>

									<div>
										<label htmlFor="res-url" className="form-label">
											URL
										</label>
										<input
											id="res-url"
											value={url}
											onChange={(e) => setUrl(e.target.value)}
											placeholder="https://..."
											className="form-input text-sm"
										/>
									</div>

									<div>
										<label htmlFor="res-desc" className="form-label">
											Description (optional)
										</label>
										<textarea
											id="res-desc"
											value={description}
											onChange={(e) => setDescription(e.target.value)}
											placeholder="Why is this useful?"
											rows={2}
											className="form-input text-sm resize-none"
										/>
									</div>

									<div>
										<label htmlFor="res-topic" className="form-label">
											Topic
										</label>
										<select
											id="res-topic"
											value={topic}
											onChange={(e) => setTopic(e.target.value)}
											className="form-input text-sm"
										>
											{TOPICS.map((t) => (
												<option key={t} value={t}>
													{formatTopicLabel(t)}
												</option>
											))}
										</select>
									</div>

									{error && <p className="text-neon-red text-tiny font-mono font-bold">{error}</p>}

									<button
										type="submit"
										disabled={submitting}
										className="btn-neon w-full py-2.5 text-sm flex items-center justify-center gap-2"
									>
										{submitting ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin" /> Submitting…
											</>
										) : (
											'Submit for Review'
										)}
									</button>

									<p className="text-text-dim font-mono text-micro text-center">
										Resources are reviewed by admins before appearing in the library
									</p>
								</form>
							)}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
