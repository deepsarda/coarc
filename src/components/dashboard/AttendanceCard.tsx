'use client';

import { AlertTriangle, CheckCircle2, GraduationCap, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

interface AttendanceInsight {
	course_id: number;
	course_name: string;
	attended: number;
	total: number;
	percentage: number;
	skippable: number;
	risk_level: 'safe' | 'warning' | 'danger';
	projected_end: number;
	monthly_percentage: number;
	monthly_total: number;
}

function RiskIcon({ risk }: { risk: string }): ReactNode {
	if (risk === 'safe') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
	if (risk === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
	return <ShieldAlert className="w-4 h-4 text-red-400" />;
}

export default function AttendanceCard() {
	const [insights, setInsights] = useState<AttendanceInsight[]>([]);

	const fetchInsights = useCallback(async () => {
		try {
			const res = await fetch('/api/attendance/calculator');
			if (!res.ok) return;
			const data = await res.json();
			if (data.insights) setInsights(data.insights);
		} catch (err) {
			console.error('[AttendanceCard] Failed to fetch attendance insights:', err);
		}
	}, []);

	useEffect(() => {
		fetchInsights();
	}, [fetchInsights]);

	if (insights.length === 0) return null;

	const avgPct =
		insights.length > 0
			? Math.round(insights.reduce((a, i) => a + i.percentage, 0) / insights.length)
			: 0;

	const monthlyAvg =
		insights.filter((i) => i.monthly_total > 0).length > 0
			? Math.round(
					insights
						.filter((i) => i.monthly_total > 0)
						.reduce((a, i) => a + i.monthly_percentage, 0) /
						insights.filter((i) => i.monthly_total > 0).length,
				)
			: null;

	const riskColor = (risk: string) =>
		risk === 'safe' ? 'text-emerald-400' : risk === 'warning' ? 'text-amber-400' : 'text-red-400';

	const riskBorder = (risk: string) =>
		risk === 'safe'
			? 'border-l-emerald-400/30'
			: risk === 'warning'
				? 'border-l-amber-400/30'
				: 'border-l-red-400/30';

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="dash-heading">
					<GraduationCap className="w-4 h-4 text-neon-cyan opacity-60" /> Attendance
				</h3>
				<div className="flex items-center gap-3">
					{monthlyAvg !== null && (
						<span className="font-mono text-[11px] text-text-muted uppercase tracking-widest">
							mo:{' '}
							<span
								className={`font-black tabular-nums text-xs ${monthlyAvg >= 75 ? 'text-emerald-400' : monthlyAvg >= 60 ? 'text-amber-400' : 'text-red-400'}`}
							>
								{monthlyAvg}%
							</span>
						</span>
					)}
					<span
						className={`font-mono text-base font-black tabular-nums ${avgPct >= 75 ? 'text-emerald-400' : avgPct >= 60 ? 'text-amber-400' : 'text-red-400'}`}
					>
						{avgPct}%
					</span>
				</div>
			</div>

			<div className="space-y-1.5">
				{insights.map((c) => (
					<div
						key={c.course_id}
						className={`flex items-center gap-3 p-3 border-l-2 ${riskBorder(c.risk_level)} dash-row-hover`}
					>
						<RiskIcon risk={c.risk_level} />
						<span className="font-mono text-xs uppercase tracking-widest font-black text-text-primary truncate flex-1 min-w-0">
							{c.course_name}
						</span>
						<span
							className={`font-mono text-sm font-black tabular-nums shrink-0 ${riskColor(c.risk_level)}`}
						>
							{Math.round(c.percentage)}%
						</span>
						<span className="dash-sub shrink-0">
							{c.attended}/{c.total}
						</span>
						{c.skippable > 0 ? (
							<span className="font-mono text-[11px] text-emerald-400/60 uppercase tracking-widest shrink-0">
								skip:{c.skippable}
							</span>
						) : (
							<span className="font-mono text-[11px] text-red-400/60 uppercase tracking-widest shrink-0">
								no_skip
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
