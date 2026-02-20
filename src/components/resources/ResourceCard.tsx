'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export interface Resource {
	id: number;
	title: string;
	url: string;
	description: string | null;
	topic: string;
	status: string;
	created_at: string;
	profiles: { display_name: string } | null;
}

const TOPIC_COLORS: Record<string, string> = {
	dp: 'neon-cyan',
	graphs: 'neon-purple',
	greedy: 'neon-green',
	math: 'neon-orange',
	strings: 'neon-magenta',
	trees: 'neon-green',
	data_structures: 'neon-cyan',
	number_theory: 'neon-yellow',
	geometry: 'neon-orange',
	sorting: 'neon-magenta',
	binary_search: 'neon-purple',
	segment_trees: 'neon-red',
	implementation: 'neon-cyan',
	general: 'neon-cyan',
};

function getTopicColor(topic: string) {
	return TOPIC_COLORS[topic] ?? 'neon-cyan';
}

function formatTopicLabel(topic: string) {
	return topic.replace(/_/g, ' ');
}

export function ResourceCard({ resource, index }: { resource: Resource; index: number }) {
	const color = getTopicColor(resource.topic);

	return (
		<motion.div
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.1 + index * 0.04 }}
			className={`border-l-2 border-l-${color}/40 pl-4 py-3 hover:bg-elevated/30 transition-colors group`}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1 min-w-0">
					{/* Topic badge */}
					<div className="flex items-center gap-2 mb-1.5">
						<span
							className={`px-2 py-0.5 font-mono text-micro uppercase tracking-widest font-bold border border-${color}/30 text-${color} bg-${color}/5`}
						>
							{formatTopicLabel(resource.topic)}
						</span>
					</div>

					{/* Title as link */}
					<a
						href={resource.url}
						target="_blank"
						rel="noopener noreferrer"
						className="font-heading font-black text-text-primary text-base hover:text-neon-green transition-colors inline-flex items-center gap-1.5 group/link"
					>
						{resource.title}
						<ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-60 transition-opacity" />
					</a>

					{/* Description */}
					{resource.description && (
						<p className="text-text-secondary text-sm font-mono mt-1 line-clamp-2">
							{resource.description}
						</p>
					)}

					{/* Meta */}
					<div className="flex items-center gap-3 mt-2">
						{resource.profiles?.display_name && (
							<span className="text-text-dim font-mono text-tiny">
								by {resource.profiles.display_name}
							</span>
						)}
						<span className="text-text-dim font-mono text-tiny">
							{new Date(resource.created_at).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
							})}
						</span>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
