import { Brain, Flame, Lightbulb, RefreshCw, Skull, Sparkles, Target } from 'lucide-react';

export interface SharedProblem {
	id: number;
	platform: 'cf' | 'lc';
	problem_url: string;
	problem_title: string;
	difficulty: string | null;
	tags: string[];
	note: string | null;
	source: string;
	created_at: string;
	profiles: { id: string; display_name: string } | null;
	reaction_counts: Record<string, number>;
	user_reaction: string | null;
	user_bookmarked: boolean;
}

export interface Recommendation {
	slot: string;
	reason: string;
	problem: {
		id: string;
		name: string;
		rating: number | null;
		tags: string[];
		url: string;
	};
	classmates_solved?: number;
}

export interface SpinnerProblem {
	id: string;
	name: string;
	rating: number | null;
	tags: string[];
	url: string;
}

export const REACTIONS = [
	{ key: 'fire', icon: <Flame className="w-3.5 h-3.5" />, label: '🔥' },
	{ key: 'brain', icon: <Brain className="w-3.5 h-3.5" />, label: '🧠' },
	{ key: 'skull', icon: <Skull className="w-3.5 h-3.5" />, label: '💀' },
];

export const SLOT_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> =
	{
		weak_topic: {
			icon: <Target className="w-4 h-4" />,
			color: 'text-neon-red',
			label: 'Weak Topic',
		},
		needs_practice: {
			icon: <RefreshCw className="w-4 h-4" />,
			color: 'text-neon-orange',
			label: 'Needs Practice',
		},
		rusty: { icon: <Sparkles className="w-4 h-4" />, color: 'text-neon-yellow', label: 'Rusty' },
		stretch_goal: {
			icon: <Lightbulb className="w-4 h-4" />,
			color: 'text-neon-purple',
			label: 'Stretch Goal',
		},
	};

export const CF_TOPICS = [
	'dp',
	'greedy',
	'graphs',
	'binary search',
	'math',
	'data structures',
	'implementation',
	'trees',
	'strings',
	'number theory',
	'geometry',
	'combinatorics',
	'sortings',
	'constructive algorithms',
	'brute force',
];

export function timeAgo(date: string): string {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	return `${days}d`;
}
