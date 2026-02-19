'use client';

import { motion } from 'framer-motion';
import { Grid3x3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dateStr } from './types';

export function AttendanceHeatmap() {
	const [data, setData] = useState<{ date: string; attended: number; bunked: number }[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const today = new Date();
			const yearAgo = new Date(today);
			yearAgo.setDate(yearAgo.getDate() - 365);
			const from = dateStr(yearAgo.getFullYear(), yearAgo.getMonth(), yearAgo.getDate());
			const to = dateStr(today.getFullYear(), today.getMonth(), today.getDate());

			try {
				const res = await fetch(`/api/attendance/records?from=${from}&to=${to}`);
				if (!res.ok) {
					setLoading(false);
					return;
				}
				const { records } = await res.json();
				const map = new Map<string, { attended: number; bunked: number }>();
				for (const r of (records ?? []) as { date: string; status: string }[]) {
					const entry = map.get(r.date) ?? { attended: 0, bunked: 0 };
					if (r.status === 'attended') entry.attended++;
					else entry.bunked++;
					map.set(r.date, entry);
				}
				const days: { date: string; attended: number; bunked: number }[] = [];
				for (let i = 364; i >= 0; i--) {
					const d = new Date(today);
					d.setDate(d.getDate() - i);
					const ds = dateStr(d.getFullYear(), d.getMonth(), d.getDate());
					days.push({ date: ds, ...(map.get(ds) ?? { attended: 0, bunked: 0 }) });
				}
				setData(days);
			} catch {
				/* silent */
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading)
		return (
			<div className="flex items-center justify-center py-20">
				<div className="w-8 h-8 border-2 border-neon-green/20 border-t-neon-green animate-spin" />
			</div>
		);
	if (data.length === 0)
		return (
			<div className="py-16 text-center">
				<p className="font-mono text-sm text-text-muted">No data</p>
			</div>
		);

	const COLS = 53;
	const firstDate = new Date(data[0].date);
	const dayOfWeek = firstDate.getDay();
	const padded: ((typeof data)[0] | null)[] = [
		...Array.from<null>({ length: dayOfWeek }).fill(null),
		...data,
	];

	const totalAttended = data.reduce((a, d) => a + d.attended, 0);
	const totalBunked = data.reduce((a, d) => a + d.bunked, 0);
	const activeDays = data.filter((d) => d.attended + d.bunked > 0).length;

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="font-mono text-xs text-text-muted uppercase tracking-widest font-bold flex items-center gap-1.5">
					<Grid3x3 className="w-4 h-4 text-neon-green opacity-50" /> Attendance Heatmap
				</h3>
				<div className="flex gap-5 font-mono text-[11px] text-text-muted uppercase tracking-widest">
					<span>
						<span className="text-neon-green text-xs">{totalAttended}</span> ✓
					</span>
					<span>
						<span className="text-neon-red text-xs">{totalBunked}</span> ✗
					</span>
					<span>
						<span className="text-neon-cyan text-xs">{activeDays}</span> days
					</span>
				</div>
			</div>

			<div className="overflow-x-auto pb-1">
				<div
					className="grid gap-[3px]"
					style={{
						gridTemplateRows: 'repeat(7, 1fr)',
						gridTemplateColumns: `repeat(${COLS}, 1fr)`,
						gridAutoFlow: 'column',
					}}
				>
					{padded.slice(0, COLS * 7).map((d, i) => {
						if (!d) {
							// biome-ignore lint/suspicious/noArrayIndexKey: positional grid cells never reorder
							return <div key={`pad-${i}`} className="w-[11px] h-[11px]" />;
						}
						const total = d.attended + d.bunked;
						let bg = 'rgba(255,255,255,0.03)';
						let border = 'rgba(255,255,255,0.06)';
						let shadow = 'none';
						if (total > 0) {
							const ratio = d.attended / total;
							if (ratio >= 1) {
								bg = 'rgba(57,255,20,0.5)';
								border = 'rgba(57,255,20,0.6)';
								shadow = '0 0 4px rgba(57,255,20,0.3)';
							} else if (ratio >= 0.5) {
								bg = 'rgba(255,107,0,0.4)';
								border = 'rgba(255,107,0,0.5)';
							} else {
								bg = 'rgba(255,0,64,0.4)';
								border = 'rgba(255,0,64,0.5)';
								shadow = '0 0 3px rgba(255,0,64,0.2)';
							}
						}
						return (
							<div
								key={d.date}
								className="w-[11px] h-[11px] border transition-all duration-200 cursor-crosshair hover:scale-[1.8] hover:z-10 hover:rounded-sm"
								style={{ backgroundColor: bg, borderColor: border, boxShadow: shadow }}
								title={`${d.date}: ${d.attended}✓ ${d.bunked}✗`}
							/>
						);
					})}
				</div>
			</div>

			<div className="flex items-center gap-2 justify-end">
				<span className="text-text-dim font-mono text-[10px] uppercase tracking-widest">
					Bunked
				</span>
				<div
					className="w-[11px] h-[11px] border"
					style={{ backgroundColor: 'rgba(255,0,64,0.4)', borderColor: 'rgba(255,0,64,0.5)' }}
				/>
				<div
					className="w-[11px] h-[11px] border"
					style={{ backgroundColor: 'rgba(255,107,0,0.4)', borderColor: 'rgba(255,107,0,0.5)' }}
				/>
				<div
					className="w-[11px] h-[11px] border"
					style={{ backgroundColor: 'rgba(57,255,20,0.5)', borderColor: 'rgba(57,255,20,0.6)' }}
				/>
				<span className="text-text-dim font-mono text-[10px] uppercase tracking-widest">
					Attended
				</span>
			</div>
		</motion.div>
	);
}
