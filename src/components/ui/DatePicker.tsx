'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Shared calendar helpers
 */

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) {
	return String(n).padStart(2, '0');
}

function toDateStr(y: number, m: number, d: number) {
	return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseDateStr(s: string): { y: number; m: number; d: number } | null {
	if (!s) return null;
	const [y, m, d] = s.split('-').map(Number);
	if (!y || !m || !d) return null;
	return { y, m: m - 1, d };
}

function getDaysInMonth(y: number, m: number) {
	return new Date(y, m + 1, 0).getDate();
}

function getFirstDayOfWeek(y: number, m: number) {
	return new Date(y, m, 1).getDay();
}

function todayStr() {
	const t = new Date();
	return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

/*
 * Custom date input
 */

interface DateInputProps {
	value: string; // YYYY-MM-DD
	onChange: (value: string) => void;
	min?: string;
	max?: string;
	futureOnly?: boolean; // Only allow today + future dates
	pastOnly?: boolean; // Only allow today + past dates
	className?: string;
	id?: string;
}

export function DateInput({
	value,
	onChange,
	min,
	max,
	futureOnly,
	pastOnly,
	className = '',
	id,
}: DateInputProps) {
	const CURRENT_YEAR = new Date().getFullYear();
	const [open, setOpen] = useState(false);
	const parsed = parseDateStr(value);
	const [viewMonth, setViewMonth] = useState(parsed?.m ?? new Date().getMonth());
	const containerRef = useRef<HTMLDivElement>(null);

	// Compute effective min/max from futureOnly/pastOnly
	const effectiveMin = futureOnly ? (min && min > todayStr() ? min : todayStr()) : min;
	const effectiveMax = pastOnly ? (max && max < todayStr() ? max : todayStr()) : max;

	// Close on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	// Sync view when value changes externally (but keep year locked)
	useEffect(() => {
		const p = parseDateStr(value);
		if (p) {
			setViewMonth(p.m);
		}
	}, [value]);

	const prevMonth = () => {
		if (viewMonth > 0) setViewMonth(viewMonth - 1);
	};

	const nextMonth = () => {
		if (viewMonth < 11) setViewMonth(viewMonth + 1);
	};

	const selectDate = useCallback(
		(d: number) => {
			const ds = toDateStr(CURRENT_YEAR, viewMonth, d);
			onChange(ds);
			setOpen(false);
		},
		[CURRENT_YEAR, viewMonth, onChange],
	);

	const isDisabled = useCallback(
		(d: number) => {
			const ds = toDateStr(CURRENT_YEAR, viewMonth, d);
			if (effectiveMin && ds < effectiveMin) return true;
			if (effectiveMax && ds > effectiveMax) return true;
			return false;
		},
		[CURRENT_YEAR, viewMonth, effectiveMin, effectiveMax],
	);

	const daysInMonth = getDaysInMonth(CURRENT_YEAR, viewMonth);
	const firstDay = getFirstDayOfWeek(CURRENT_YEAR, viewMonth);
	const today = todayStr();

	const displayValue = parsed
		? `${pad(parsed.d)} ${MONTH_NAMES[parsed.m]?.slice(0, 3)} ${CURRENT_YEAR}`
		: '';

	return (
		<div ref={containerRef} className="relative">
			{/* Trigger button */}
			<button
				type="button"
				id={id}
				onClick={() => setOpen(!open)}
				className={`form-input text-left flex items-center gap-2 cursor-pointer ${className}`}
			>
				<CalendarDays className="w-4 h-4 text-text-dim shrink-0" />
				<span className={displayValue ? 'text-text-primary' : 'text-text-dim'}>
					{displayValue || 'Select date'}
				</span>
			</button>

			{/* Calendar dropdown */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -4, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -4, scale: 0.98 }}
						transition={{ duration: 0.15 }}
						className="absolute z-50 top-full left-0 mt-1 w-[280px] bg-surface border border-border-hard shadow-lg shadow-void/50"
					>
						{/* Month/Year nav */}
						<div className="flex items-center justify-between px-3 py-2 border-b border-border-hard/50">
							<button
								type="button"
								onClick={prevMonth}
								className="p-1 text-text-muted hover:text-neon-cyan transition-colors"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<span className="font-mono text-tiny font-bold text-text-primary uppercase tracking-widest">
								{MONTH_NAMES[viewMonth]?.slice(0, 3)} {CURRENT_YEAR}
							</span>
							<button
								type="button"
								onClick={nextMonth}
								className="p-1 text-text-muted hover:text-neon-cyan transition-colors"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>

						{/* Day headers */}
						<div className="grid grid-cols-7 px-2 pt-2">
							{DAY_HEADERS.map((d) => (
								<div
									key={d}
									className="text-center font-mono text-micro text-text-dim font-bold py-1"
								>
									{d}
								</div>
							))}
						</div>

						{/* Day grid */}
						<div className="grid grid-cols-7 px-2 pb-2">
							{/* Empty cells for offset */}
							{Array.from({ length: firstDay }, (_, i) => (
								<div key={`empty-${i}`} />
							))}

							{Array.from({ length: daysInMonth }, (_, i) => {
								const day = i + 1;
								const ds = toDateStr(CURRENT_YEAR, viewMonth, day);
								const isSelected = ds === value;
								const isToday = ds === today;
								const disabled = isDisabled(day);

								return (
									<button
										key={day}
										type="button"
										onClick={() => !disabled && selectDate(day)}
										disabled={disabled}
										className={`
											h-8 font-mono text-tiny font-bold transition-all relative
											${
												disabled
													? 'text-text-dim/30 cursor-not-allowed'
													: isSelected
														? 'bg-neon-cyan text-void'
														: isToday
															? 'text-neon-cyan hover:bg-neon-cyan/10'
															: 'text-text-secondary hover:bg-elevated hover:text-text-primary'
											}
										`}
									>
										{day}
										{isToday && !isSelected && (
											<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full" />
										)}
									</button>
								);
							})}
						</div>

						{/* Today shortcut */}
						<div className="border-t border-border-hard/50 px-3 py-1.5">
							<button
								type="button"
								onClick={() => {
									onChange(today);
									setOpen(false);
								}}
								disabled={
									(effectiveMin ? today < effectiveMin : false) ||
									(effectiveMax ? today > effectiveMax : false)
								}
								className="font-mono text-micro text-neon-cyan hover:text-neon-cyan/80 transition-colors font-bold uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
							>
								Today
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

/*
 * Custom datetime picker
 */

interface DateTimeInputProps {
	value: string; // YYYY-MM-DDTHH:MM (datetime-local format)
	onChange: (value: string) => void;
	futureOnly?: boolean;
	pastOnly?: boolean;
	className?: string;
	id?: string;
}

export function DateTimeInput({
	value,
	onChange,
	futureOnly,
	pastOnly,
	className = '',
	id,
}: DateTimeInputProps) {
	const CURRENT_YEAR = new Date().getFullYear();
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Parse value into date + time parts
	const [datePart, timePart] = value ? value.split('T') : ['', ''];
	const parsed = parseDateStr(datePart);
	const [viewMonth, setViewMonth] = useState(parsed?.m ?? new Date().getMonth());
	const [hours, setHours] = useState(timePart ? timePart.split(':')[0] : '00');
	const [minutes, setMinutes] = useState(timePart ? timePart.split(':')[1] : '00');

	// Compute effective min/max
	const effectiveMin = futureOnly ? todayStr() : undefined;
	const effectiveMax = pastOnly ? todayStr() : undefined;

	// Close on outside click
	useEffect(() => {
		function handler(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	// Sync view when value changes externally
	useEffect(() => {
		const [dp, tp] = (value || '').split('T');
		const p = parseDateStr(dp);
		if (p) {
			setViewMonth(p.m);
		}
		if (tp) {
			const [h, m] = tp.split(':');
			setHours(h || '00');
			setMinutes(m || '00');
		}
	}, [value]);

	const prevMonth = () => {
		if (viewMonth > 0) setViewMonth(viewMonth - 1);
	};

	const nextMonth = () => {
		if (viewMonth < 11) setViewMonth(viewMonth + 1);
	};

	const selectDate = useCallback(
		(d: number) => {
			const ds = toDateStr(CURRENT_YEAR, viewMonth, d);
			onChange(`${ds}T${hours}:${minutes}`);
		},
		[CURRENT_YEAR, viewMonth, hours, minutes, onChange],
	);

	const isDisabled = useCallback(
		(d: number) => {
			const ds = toDateStr(CURRENT_YEAR, viewMonth, d);
			if (effectiveMin && ds < effectiveMin) return true;
			if (effectiveMax && ds > effectiveMax) return true;
			return false;
		},
		[CURRENT_YEAR, viewMonth, effectiveMin, effectiveMax],
	);

	const updateTime = useCallback(
		(h: string, m: string) => {
			setHours(h);
			setMinutes(m);
			if (datePart) {
				onChange(`${datePart}T${h}:${m}`);
			}
		},
		[datePart, onChange],
	);

	const daysInMonth = getDaysInMonth(CURRENT_YEAR, viewMonth);
	const firstDay = getFirstDayOfWeek(CURRENT_YEAR, viewMonth);
	const today = todayStr();

	const displayValue = parsed
		? `${pad(parsed.d)} ${MONTH_NAMES[parsed.m]?.slice(0, 3)} ${CURRENT_YEAR}, ${hours}:${minutes}`
		: '';

	return (
		<div ref={containerRef} className="relative">
			{/* Trigger button */}
			<button
				type="button"
				id={id}
				onClick={() => setOpen(!open)}
				className={`form-input text-left flex items-center gap-2 cursor-pointer ${className}`}
			>
				<CalendarDays className="w-4 h-4 text-text-dim shrink-0" />
				<span className={displayValue ? 'text-text-primary' : 'text-text-dim'}>
					{displayValue || 'Select date & time'}
				</span>
			</button>

			{/* Calendar + time dropdown */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -4, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -4, scale: 0.98 }}
						transition={{ duration: 0.15 }}
						className="absolute z-50 top-full left-0 mt-1 w-[280px] bg-surface border border-border-hard shadow-lg shadow-void/50"
					>
						{/* Month/Year nav */}
						<div className="flex items-center justify-between px-3 py-2 border-b border-border-hard/50">
							<button
								type="button"
								onClick={prevMonth}
								className="p-1 text-text-muted hover:text-neon-cyan transition-colors"
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<span className="font-mono text-tiny font-bold text-text-primary uppercase tracking-widest">
								{MONTH_NAMES[viewMonth]?.slice(0, 3)} {CURRENT_YEAR}
							</span>
							<button
								type="button"
								onClick={nextMonth}
								className="p-1 text-text-muted hover:text-neon-cyan transition-colors"
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>

						{/* Day headers */}
						<div className="grid grid-cols-7 px-2 pt-2">
							{DAY_HEADERS.map((d) => (
								<div
									key={d}
									className="text-center font-mono text-micro text-text-dim font-bold py-1"
								>
									{d}
								</div>
							))}
						</div>

						{/* Day grid */}
						<div className="grid grid-cols-7 px-2 pb-2">
							{Array.from({ length: firstDay }, (_, i) => (
								<div key={`empty-${i}`} />
							))}

							{Array.from({ length: daysInMonth }, (_, i) => {
								const day = i + 1;
								const ds = toDateStr(CURRENT_YEAR, viewMonth, day);
								const isSelected = ds === datePart;
								const isToday = ds === today;
								const disabled = isDisabled(day);

								return (
									<button
										key={day}
										type="button"
										onClick={() => !disabled && selectDate(day)}
										disabled={disabled}
										className={`
											h-8 font-mono text-tiny font-bold transition-all relative
											${
												disabled
													? 'text-text-dim/30 cursor-not-allowed'
													: isSelected
														? 'bg-neon-cyan text-void'
														: isToday
															? 'text-neon-cyan hover:bg-neon-cyan/10'
															: 'text-text-secondary hover:bg-elevated hover:text-text-primary'
											}
										`}
									>
										{day}
										{isToday && !isSelected && (
											<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-cyan rounded-full" />
										)}
									</button>
								);
							})}
						</div>

						{/* Time picker */}
						<div className="border-t border-border-hard/50 px-3 py-2 flex items-center gap-2">
							<span className="font-mono text-micro text-text-dim font-bold uppercase tracking-widest">
								Time
							</span>
							<div className="flex items-center gap-1 ml-auto">
								<input
									type="number"
									min={0}
									max={23}
									value={hours}
									onChange={(e) =>
										updateTime(pad(Math.min(23, Math.max(0, Number(e.target.value)))), minutes)
									}
									className="w-10 bg-void border border-border-hard text-center font-mono text-tiny text-text-primary py-1 focus:border-neon-cyan outline-none"
								/>
								<span className="text-text-dim font-mono text-tiny font-bold">:</span>
								<input
									type="number"
									min={0}
									max={59}
									value={minutes}
									onChange={(e) =>
										updateTime(hours, pad(Math.min(59, Math.max(0, Number(e.target.value)))))
									}
									className="w-10 bg-void border border-border-hard text-center font-mono text-tiny text-text-primary py-1 focus:border-neon-cyan outline-none"
								/>
							</div>
						</div>

						{/* Done button */}
						<div className="border-t border-border-hard/50 px-3 py-1.5 flex justify-end">
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="font-mono text-micro text-neon-cyan hover:text-neon-cyan/80 transition-colors font-bold uppercase tracking-widest"
							>
								Done
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
