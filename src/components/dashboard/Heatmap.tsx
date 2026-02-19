"use client";

import { CalendarRange } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 365-day GitHub-style heatmap rendered as pure CSS grid
// Data from:  lc_stats.submission_calendar (JSON: { unixTimestamp: count })
//             cf_submissions.submitted_at
// Both merged into a single day→count map.

interface HeatmapProps {
	userId: string;
}

interface DayData {
	date: string; // YYYY-MM-DD
	count: number;
}

const DAYS = 365;
const COLS = 53; // weeks

export default function Heatmap({ userId }: HeatmapProps) {
	const [data, setData] = useState<DayData[]>([]);
	const [totalSolves, setTotalSolves] = useState(0);
	const [activeDays, setActiveDays] = useState(0);
	const supabase = useMemo(() => createClient(), []);

	const fetch = useCallback(async () => {
		const dayMap = new Map<string, number>();

		// 1. LC submission calendar
		const { data: lcStats } = await supabase
			.from("lc_stats")
			.select("submission_calendar")
			.eq("user_id", userId)
			.single();

		if (lcStats?.submission_calendar) {
			const cal = lcStats.submission_calendar as Record<string, number>;
			for (const [ts, count] of Object.entries(cal)) {
				const d = new Date(Number(ts) * 1000).toISOString().split("T")[0];
				dayMap.set(d, (dayMap.get(d) ?? 0) + count);
			}
		}

		// 2. CF submissions
		const oneYearAgo = new Date();
		oneYearAgo.setDate(oneYearAgo.getDate() - DAYS);

		const { data: cfSubs } = await supabase
			.from("cf_submissions")
			.select("submitted_at")
			.eq("user_id", userId)
			.gte("submitted_at", oneYearAgo.toISOString())
			.order("submitted_at", { ascending: false });

		if (cfSubs) {
			for (const s of cfSubs) {
				const d = s.submitted_at.split("T")[0];
				dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
			}
		}

		// 3. Also count LC submissions directly (in case submission_calendar is incomplete)
		const { data: lcSubs } = await supabase
			.from("lc_submissions")
			.select("submitted_at")
			.eq("user_id", userId)
			.gte("submitted_at", oneYearAgo.toISOString());

		if (lcSubs) {
			for (const s of lcSubs) {
				const d = s.submitted_at.split("T")[0];
				dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
			}
		}

		// Build 365 days
		const today = new Date();
		const days: DayData[] = [];
		for (let i = DAYS - 1; i >= 0; i--) {
			const d = new Date(today);
			d.setDate(d.getDate() - i);
			const ds = d.toISOString().split("T")[0];
			days.push({ date: ds, count: dayMap.get(ds) ?? 0 });
		}

		setData(days);
		setTotalSolves(days.reduce((acc, d) => acc + d.count, 0));
		setActiveDays(days.filter((d) => d.count > 0).length);
	}, [userId, supabase]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	// Compute max for color scaling
	const maxCount = useMemo(
		() => Math.max(1, ...data.map((d) => d.count)),
		[data],
	);

	if (data.length === 0) return null;

	// Pad the beginning so the grid starts on Sunday
	const firstDate = new Date(data[0].date);
	const dayOfWeek = firstDate.getDay(); // 0=Sun
	const padded: (DayData | null)[] = [
		...Array.from<null>({ length: dayOfWeek }).fill(null),
		...data,
	];

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h3 className="dash-heading">
					<CalendarRange className="w-4 h-4 text-neon-cyan opacity-50" />{" "}
					Submissions
				</h3>
				<div className="flex gap-5 dash-sub">
					<span>
						<span className="text-neon-cyan text-xs">{totalSolves}</span> solves
					</span>
					<span>
						<span className="text-emerald-400 text-xs">{activeDays}</span>{" "}
						active
					</span>
				</div>
			</div>

			{/* Heatmap grid */}
			<div className="overflow-x-auto pb-1">
				<div
					className="grid gap-[3px]"
					style={{
						gridTemplateRows: "repeat(7, 1fr)",
						gridTemplateColumns: `repeat(${COLS}, 1fr)`,
						gridAutoFlow: "column",
					}}
				>
					{padded.slice(0, COLS * 7).map((d, i) => {
						if (!d) {
							return <div key={`pad-${i}`} className="w-[11px] h-[11px]" />;
						}
						const intensity = d.count / maxCount;
						return (
							<div
								key={d.date}
								className="w-[11px] h-[11px] border transition-all duration-200 cursor-crosshair hover:scale-[1.8] hover:z-10 hover:rounded-sm relative"
								style={{
									backgroundColor:
										d.count === 0
											? "rgba(255,255,255,0.03)"
											: `rgba(0, 240, 255, ${0.15 + intensity * 0.85})`,
									borderColor:
										d.count === 0
											? "rgba(255,255,255,0.06)"
											: `rgba(0, 240, 255, ${0.2 + intensity * 0.5})`,
									boxShadow:
										d.count > 0
											? `0 0 ${Math.round(intensity * 6)}px rgba(0, 240, 255, ${intensity * 0.4})`
											: "none",
								}}
								title={`${d.date}: ${d.count} solve${d.count !== 1 ? "s" : ""}`}
							/>
						);
					})}
				</div>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-2 justify-end">
				<span className="text-text-dim font-mono text-[10px] uppercase tracking-widest">
					Less
				</span>
				{[0, 0.25, 0.5, 0.75, 1].map((level) => (
					<div
						key={level}
						className="w-[11px] h-[11px] border"
						style={{
							backgroundColor:
								level === 0
									? "rgba(255,255,255,0.03)"
									: `rgba(0, 240, 255, ${0.15 + level * 0.85})`,
							borderColor:
								level === 0
									? "rgba(255,255,255,0.06)"
									: `rgba(0, 240, 255, ${0.2 + level * 0.5})`,
						}}
					/>
				))}
				<span className="text-text-dim font-mono text-[10px] uppercase tracking-widest">
					More
				</span>
			</div>
		</div>
	);
}
