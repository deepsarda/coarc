"use client";

import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Radar-style topic breakdown using pure CSS
// Data from: cf_submissions.tags + lc_submissions joined with lc_problems.topics

interface TopicRadarProps {
	userId: string;
}

interface TopicEntry {
	topic: string;
	count: number;
	pct: number; // 0-100
}

// Standard topic color map
const TOPIC_COLORS: Record<string, string> = {
	dp: "#00f0ff",
	"dynamic programming": "#00f0ff",
	graphs: "#f97316",
	graph: "#f97316",
	trees: "#22c55e",
	tree: "#22c55e",
	greedy: "#eab308",
	"binary search": "#a855f7",
	sorting: "#ec4899",
	math: "#06b6d4",
	implementation: "#64748b",
	strings: "#f43f5e",
	string: "#f43f5e",
	"two pointers": "#8b5cf6",
	"dfs and similar": "#f97316",
	"brute force": "#78716c",
	"data structures": "#3b82f6",
	"constructive algorithms": "#14b8a6",
	"number theory": "#06b6d4",
	combinatorics: "#d946ef",
	geometry: "#fb923c",
	bitmasks: "#7c3aed",
	array: "#3b82f6",
	"hash table": "#8b5cf6",
	stack: "#ef4444",
	heap: "#f59e0b",
	"sliding window": "#10b981",
	backtracking: "#e11d48",
	"linked list": "#6366f1",
	matrix: "#0ea5e9",
	"bit manipulation": "#7c3aed",
	"divide and conquer": "#d97706",
	"union find": "#0891b2",
	trie: "#059669",
	simulation: "#78716c",
};

function getTopicColor(topic: string): string {
	const key = topic.toLowerCase();
	return TOPIC_COLORS[key] ?? "#6b7280";
}

export default function TopicRadar({ userId }: TopicRadarProps) {
	const [topics, setTopics] = useState<TopicEntry[]>([]);
	const supabase = useMemo(() => createClient(), []);

	const fetchTopics = useCallback(async () => {
		const topicMap = new Map<string, number>();

		// CF submissions
		const { data: cfSubs } = await supabase
			.from("cf_submissions")
			.select("tags")
			.eq("user_id", userId);

		if (cfSubs) {
			for (const s of cfSubs) {
				const tags = (s.tags as string[]) ?? [];
				for (const tag of tags) {
					const normalized = tag.toLowerCase().trim();
					if (normalized) {
						topicMap.set(normalized, (topicMap.get(normalized) ?? 0) + 1);
					}
				}
			}
		}

		// LC submission, we need to cross-reference with lc_problems for topics
		const { data: lcSubs } = await supabase
			.from("lc_submissions")
			.select("problem_slug")
			.eq("user_id", userId);

		if (lcSubs && lcSubs.length > 0) {
			const slugs = [...new Set(lcSubs.map((s) => s.problem_slug))];

			const { data: problems } = await supabase
				.from("lc_problems")
				.select("slug, topics")
				.in("slug", slugs.slice(0, 500));

			if (problems) {
				for (const p of problems) {
					const lcTopics = (p.topics as string[]) ?? [];
					for (const topic of lcTopics) {
						const normalized = topic.toLowerCase().trim();
						if (normalized) {
							topicMap.set(normalized, (topicMap.get(normalized) ?? 0) + 1);
						}
					}
				}
			}
		}

		// Build sorted array
		const sorted = [...topicMap.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 12); // Top 12 topics

		const maxVal = Math.max(1, sorted[0]?.[1] ?? 1);
		const entries: TopicEntry[] = sorted.map(([topic, count]) => ({
			topic,
			count,
			pct: Math.round((count / maxVal) * 100),
		}));

		setTopics(entries);
	}, [userId, supabase]);

	useEffect(() => {
		fetchTopics();
	}, [fetchTopics]);

	if (topics.length === 0) return null;

	const totalSolves = topics.reduce((acc, t) => acc + t.count, 0);

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="dash-heading">
					<Radar className="w-4 h-4 text-neon-cyan opacity-50" /> Topic Radar
				</h3>
				<span className="dash-sub">
					{topics.length} topics &middot; {totalSolves} solves
				</span>
			</div>

			{/* Bar chart */}
			<div className="space-y-1.5">
				{topics.map((t, i) => {
					const color = getTopicColor(t.topic);
					return (
						<motion.div
							key={t.topic}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								delay: i * 0.05,
								duration: 0.4,
								ease: [0.16, 1, 0.3, 1],
							}}
							className="group"
						>
							<div className="flex items-center justify-between mb-0.5">
								<span className="font-mono text-xs uppercase tracking-widest font-bold text-text-muted group-hover:text-text-primary transition-colors truncate max-w-[60%]">
									{t.topic}
								</span>
								<span
									className="font-mono text-xs font-black tabular-nums"
									style={{ color }}
								>
									{t.count}
								</span>
							</div>
							<div className="h-[6px] w-full bg-void border border-border-subtle p-px overflow-hidden">
								<motion.div
									className="h-full"
									initial={{ width: 0 }}
									animate={{ width: `${t.pct}%` }}
									transition={{
										delay: 0.2 + i * 0.06,
										duration: 0.8,
										ease: [0.16, 1, 0.3, 1],
									}}
									style={{
										backgroundColor: color,
										boxShadow: `0 0 6px ${color}60`,
									}}
								/>
							</div>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
