'use client';

import { motion } from 'framer-motion';
import { Radio, Satellite } from 'lucide-react';

export interface ActivityItem {
	id: string;
	platform: 'cf' | 'lc';
	title: string;
	subtitle: string;
	timestamp: string;
}

interface ActivityLogProps {
	activity: ActivityItem[];
	hasPlatforms: boolean;
}

const MAX_VISIBLE = 30;

export default function ActivityLog({ activity, hasPlatforms }: ActivityLogProps) {
	const shown = activity.slice(0, MAX_VISIBLE);

	return (
		<div className="border border-border-subtle relative">
			{/* Header */}
			<div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
				<h3 className="dash-heading">
					<span className="text-neon-cyan">::</span> Activity_Log
				</h3>
				{activity.length > 0 && <span className="dash-sub">{activity.length} entries</span>}
			</div>

			{/* Items with strict height */}
			{shown.length > 0 ? (
				<div className="max-h-[420px] overflow-y-auto scrollbar-thin">
					{shown.map((item, i) => (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: 0.03 * Math.min(i, 12),
								duration: 0.35,
								ease: [0.16, 1, 0.3, 1],
							}}
							className="flex items-center gap-3 px-5 py-3 dash-row-hover border-b border-border-subtle last:border-0 group/row"
						>
							<span
								className={`font-mono text-[11px] font-black shrink-0 w-6 text-center ${
									item.platform === 'lc' ? 'text-orange-400' : 'text-cyan-400'
								}`}
							>
								{item.platform === 'lc' ? 'LC' : 'CF'}
							</span>
							<div className="flex-1 min-w-0">
								<p className="text-text-primary font-mono text-sm font-bold truncate group-hover/row:text-neon-cyan transition-colors duration-200">
									{item.title}
								</p>
							</div>
							<span className="text-text-muted font-mono text-xs uppercase tracking-widest shrink-0">
								{item.subtitle}
							</span>
							<span className="text-text-dim font-mono text-[11px] tabular-nums shrink-0">
								{formatTimeAgo(item.timestamp)}
							</span>
						</motion.div>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
					<div className="opacity-15">
						{hasPlatforms ? <Radio className="w-10 h-10" /> : <Satellite className="w-10 h-10" />}
					</div>
					<p className="dash-heading">
						{hasPlatforms ? 'Hit SYNC to load activity' : 'Link a platform handle'}
					</p>
				</div>
			)}
		</div>
	);
}

function formatTimeAgo(timestamp: string): string {
	const now = Date.now();
	const then = new Date(timestamp).getTime();
	const diffMs = now - then;
	const diffMins = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffMins < 1) return 'now';
	if (diffMins < 60) return `${diffMins}m`;
	if (diffHours < 24) return `${diffHours}h`;
	if (diffDays < 30) return `${diffDays}d`;
	return new Date(timestamp).toLocaleDateString('en-IN');
}
