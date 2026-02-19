'use client';

import { Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Card from '@/components/ui/Card';

interface BadgesCardProps {
	earned: number;
	total: number;
}

export default function BadgesCard({ earned, total }: BadgesCardProps) {
	const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

	return (
		<Card title="Badges">
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-2xl font-mono font-black text-neon-orange tracking-tighter">
							{earned}
							<span className="text-text-muted text-lg">/{total}</span>
						</p>
						<p className="text-text-muted font-mono text-tiny uppercase tracking-widest font-black flex items-center gap-1.5">
							<Award className="w-3 h-3" /> Earned
						</p>
					</div>
					<Link
						href="/badges"
						className="flex items-center gap-1 px-3 py-1.5 border border-border-hard bg-zinc-950 hover:border-neon-orange/50 transition-colors font-mono text-tiny uppercase tracking-widest font-black text-text-muted hover:text-neon-orange"
					>
						View <ChevronRight className="w-3 h-3" />
					</Link>
				</div>
				{total > 0 && (
					<div className="h-1 w-full bg-void border border-border-hard/30 p-px">
						<div className="h-full bg-neon-orange/60" style={{ width: `${pct}%` }} />
					</div>
				)}
			</div>
		</Card>
	);
}
