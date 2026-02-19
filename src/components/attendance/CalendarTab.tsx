'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AttendanceRecord } from './types';
import { DAYS, dateStr, MONTHS, todayStr } from './types';

interface CalendarTabProps {
	records: AttendanceRecord[];
	calMonth: number;
	calYear: number;
	onMonthChange: (month: number, year: number) => void;
}

export function CalendarTab({ records, calMonth, calYear, onMonthChange }: CalendarTabProps) {
	const [expandedDay, setExpandedDay] = useState<string | null>(null);

	const calendarData = useMemo(() => {
		const map = new Map<string, { attended: number; bunked: number }>();
		for (const r of records) {
			const entry = map.get(r.date) ?? { attended: 0, bunked: 0 };
			if (r.status === 'attended') entry.attended++;
			else entry.bunked++;
			map.set(r.date, entry);
		}
		return map;
	}, [records]);

	const calendarGrid = useMemo(() => {
		const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
		const firstDay = new Date(calYear, calMonth, 1).getDay();
		const grid: (number | null)[] = [];
		for (let i = 0; i < firstDay; i++) grid.push(null);
		for (let d = 1; d <= daysInMonth; d++) grid.push(d);
		return grid;
	}, [calYear, calMonth]);

	const prevMonth = () => {
		if (calMonth === 0) onMonthChange(11, calYear - 1);
		else onMonthChange(calMonth - 1, calYear);
	};
	const nextMonth = () => {
		if (calMonth === 11) onMonthChange(0, calYear + 1);
		else onMonthChange(calMonth + 1, calYear);
	};

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
			<div className="flex items-center justify-between mb-4">
				<button
					type="button"
					onClick={prevMonth}
					className="p-2 text-text-muted hover:text-text-primary transition-colors"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>
				<span className="font-heading text-lg font-black text-text-primary">
					{MONTHS[calMonth]} {calYear}
				</span>
				<button
					type="button"
					onClick={nextMonth}
					className="p-2 text-text-muted hover:text-text-primary transition-colors"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>

			<div className="grid grid-cols-7 gap-1 mb-1">
				{DAYS.map((d) => (
					<div key={d} className="text-center font-mono text-tiny text-text-muted font-bold py-1">
						{d}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1">
				{calendarGrid.map((day, idx) => {
					if (day === null) return <div key={`empty-${7 * Math.floor(idx / 7) + (idx % 7)}`} />;
					const ds = dateStr(calYear, calMonth, day);
					const data = calendarData.get(ds);
					const isToday = ds === todayStr();
					const isSelected = expandedDay === ds;
					let cellColor = 'bg-transparent';
					if (data) {
						if (data.bunked === 0) cellColor = 'bg-neon-green/15';
						else if (data.attended === 0) cellColor = 'bg-neon-red/15';
						else cellColor = 'bg-neon-orange/15';
					}
					return (
						<button
							key={ds}
							type="button"
							onClick={() => setExpandedDay(isSelected ? null : ds)}
							className={`aspect-square flex items-center justify-center font-mono text-sm transition-all border ${isToday ? 'border-neon-cyan/40' : 'border-transparent'} ${cellColor} ${isSelected ? 'ring-1 ring-neon-cyan' : ''} hover:border-border-hard`}
						>
							{day}
						</button>
					);
				})}
			</div>

			<div className="flex items-center gap-4 mt-4 justify-center">
				{[
					{ color: 'bg-neon-green/15', label: 'All attended' },
					{ color: 'bg-neon-orange/15', label: 'Partial' },
					{ color: 'bg-neon-red/15', label: 'All bunked' },
				].map((l) => (
					<div key={l.label} className="flex items-center gap-1.5">
						<div className={`w-3 h-3 ${l.color} border border-border-hard/30`} />
						<span className="font-mono text-tiny text-text-muted">{l.label}</span>
					</div>
				))}
			</div>

			<AnimatePresence>
				{expandedDay && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="mt-4 border border-border-hard p-4 overflow-hidden"
					>
						<h3 className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-3">
							{new Date(`${expandedDay}T00:00:00`).toLocaleDateString('en-IN', {
								weekday: 'long',
								day: 'numeric',
								month: 'short',
							})}
						</h3>
						{records
							.filter((r) => r.date === expandedDay)
							.map((r) => (
								<div key={r.id} className="flex items-center gap-2 mb-1.5 last:mb-0">
									<div
										className="w-2 h-2 rounded-full shrink-0"
										style={{ backgroundColor: r.courses.color }}
									/>
									<span className="font-mono text-sm text-text-primary">{r.courses.name}</span>
									{r.slot > 1 && (
										<span className="font-mono text-tiny text-text-muted">Slot {r.slot}</span>
									)}
									<span
										className={`font-mono text-tiny font-bold ml-auto ${r.status === 'attended' ? 'text-neon-green' : 'text-neon-red'}`}
									>
										{r.status === 'attended' ? '✓ Attended' : '✗ Bunked'}
									</span>
								</div>
							))}
						{records.filter((r) => r.date === expandedDay).length === 0 && (
							<p className="font-mono text-sm text-text-muted">No classes marked</p>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
