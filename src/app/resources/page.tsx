'use client';

import { motion } from 'framer-motion';
import { BookOpen, Filter, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type Resource, ResourceCard } from '@/components/resources/ResourceCard';
import { SubmitResourceModal } from '@/components/resources/SubmitResourceModal';

export default function ResourcesPage() {
	const [resources, setResources] = useState<Resource[]>([]);
	const [topics, setTopics] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [topicFilter, setTopicFilter] = useState<string | null>(null);
	const [showSubmit, setShowSubmit] = useState(false);

	function fetchResources() {
		const params = topicFilter ? `?topic=${topicFilter}` : '';
		fetch(`/api/resources/list${params}`)
			.then((r) => r.json())
			.then((d) => {
				setResources(d.resources ?? []);
				setTopics(d.topics ?? []);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}

	useEffect(() => {
		fetchResources();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [topicFilter]);

	const filtered = useMemo(() => {
		if (!search) return resources;
		const q = search.toLowerCase();
		return resources.filter(
			(r) =>
				r.title.toLowerCase().includes(q) ||
				(r.description ?? '').toLowerCase().includes(q) ||
				r.topic.toLowerCase().includes(q),
		);
	}, [resources, search]);

	function formatTopicLabel(t: string) {
		return t.replace(/_/g, ' ');
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-green/20 border-t-neon-green animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[800px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-green/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-green pl-6 mb-8"
			>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
							<span className="text-neon-green">::</span> Resources
						</h1>
						<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
							Curated Learning Materials
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowSubmit(true)}
						className="btn-neon px-4 py-2 text-sm flex items-center gap-2"
					>
						<Plus className="w-4 h-4" /> Submit
					</button>
				</div>
			</motion.header>

			{/* CONTROLS */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="mb-6"
			>
				<div className="relative mb-3">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search resources..."
						className="form-input pl-10 py-2.5 text-sm"
					/>
				</div>

				{/* Topic filter pills */}
				{topics.length > 0 && (
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setTopicFilter(null)}
							className={`flex items-center gap-1 px-3 py-1 font-mono text-tiny uppercase tracking-widest font-bold border transition-colors ${
								!topicFilter
									? 'border-neon-green/50 text-neon-green bg-neon-green/10'
									: 'border-border-hard text-text-muted hover:text-text-secondary'
							}`}
						>
							<Filter className="w-3 h-3" /> All
						</button>
						{topics.map((t) => (
							<button
								type="button"
								key={t}
								onClick={() => setTopicFilter(topicFilter === t ? null : t)}
								className={`px-3 py-1 font-mono text-tiny uppercase tracking-widest font-bold border transition-colors ${
									topicFilter === t
										? 'border-neon-green/50 text-neon-green bg-neon-green/10'
										: 'border-border-hard text-text-muted hover:text-text-secondary'
								}`}
							>
								{formatTopicLabel(t)}
							</button>
						))}
					</div>
				)}
			</motion.div>

			{/* RESOURCE LIST */}
			{filtered.length === 0 ? (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
					<BookOpen className="w-12 h-12 text-text-dim mx-auto mb-4" />
					<p className="text-text-muted font-mono text-sm">No resources yet</p>
					<p className="text-text-dim font-mono text-tiny mt-1">
						Submit a resource to get started! Admins will review it as soon possible!
					</p>
				</motion.div>
			) : (
				<div className="space-y-1">
					{filtered.map((resource, i) => (
						<ResourceCard key={resource.id} resource={resource} index={i} />
					))}
				</div>
			)}

			{/* SUBMIT MODAL */}
			<SubmitResourceModal
				open={showSubmit}
				onClose={() => setShowSubmit(false)}
				onSubmitted={fetchResources}
			/>
		</div>
	);
}
