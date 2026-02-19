'use client';

import { motion } from 'framer-motion';
import { Bookmark, Code, RefreshCw, Target } from 'lucide-react';
import { useState } from 'react';
import { BookmarksTab } from '@/components/problems/BookmarksTab';
import { FeedTab } from '@/components/problems/FeedTab';
import { RecommendTab } from '@/components/problems/RecommendTab';
import { SpinnerTab } from '@/components/problems/SpinnerTab';

/*  Page  */

export default function ProblemsPage() {
	const [tab, setTab] = useState<'recommend' | 'feed' | 'spinner' | 'bookmarks'>('recommend');

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[900px] mx-auto relative">
			{/* Header */}
			<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
				<h1 className="font-heading text-2xl sm:text-3xl font-black text-text-primary uppercase tracking-wider mb-1">
					Problems
				</h1>
				<p className="font-mono text-sm text-text-muted mb-6">
					Recommendations, community feed, and random spinner
				</p>
			</motion.div>

			{/* TABS */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="flex gap-1 mb-6 border border-border-hard p-1"
			>
				{(
					[
						{
							key: 'recommend',
							label: 'For You',
							icon: <Target className="w-4 h-4 sm:w-3.5 sm:h-3.5" />,
						},
						{ key: 'feed', label: 'Feed', icon: <Code className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> },
						{
							key: 'spinner',
							label: 'Spin',
							icon: <RefreshCw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />,
						},
						{
							key: 'bookmarks',
							label: 'Saved',
							icon: <Bookmark className="w-4 h-4 sm:w-3.5 sm:h-3.5" />,
						},
					] as const
				).map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						title={t.label}
						className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-2 font-mono text-tiny uppercase tracking-widest font-bold transition-colors ${
							tab === t.key
								? 'bg-neon-purple/10 text-neon-purple'
								: 'text-text-muted hover:text-text-secondary'
						}`}
					>
						{t.icon} <span className="hidden sm:inline">{t.label}</span>
					</button>
				))}
			</motion.div>

			{tab === 'recommend' && <RecommendTab />}
			{tab === 'feed' && <FeedTab />}
			{tab === 'spinner' && <SpinnerTab />}
			{tab === 'bookmarks' && <BookmarksTab />}
		</div>
	);
}
