'use client';

import { motion } from 'framer-motion';
import { CalendarCheck, Check, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AttendanceRecord, Course } from './types';
import { dateStr, todayStr } from './types';

interface MarkTabProps {
	courses: Course[];
	records: AttendanceRecord[];
	selectedDate: string;
	onDateChange: (date: string) => void;
	onRefresh: () => Promise<void>;
}

export function MarkTab({ courses, records, selectedDate, onDateChange, onRefresh }: MarkTabProps) {
	const [saving, setSaving] = useState<string | null>(null);
	const [courseSlots, setCourseSlots] = useState<Record<number, number>>({});

	/* Records map for selected date */
	const dayRecords = useMemo(() => {
		const map = new Map<string, 'attended' | 'bunked'>();
		for (const r of records) {
			if (r.date === selectedDate) map.set(`${r.course_id}-${r.slot}`, r.status);
		}
		return map;
	}, [records, selectedDate]);

	useEffect(() => {
		const slots: Record<number, number> = {};
		for (const r of records) {
			if (r.date === selectedDate) {
				slots[r.course_id] = Math.max(slots[r.course_id] ?? 1, r.slot);
			}
		}
		setCourseSlots(slots);
	}, [records, selectedDate]);

	/* Mark or clear attendance */
	const markAttendance = useCallback(
		async (courseId: number, slot: number, status: 'attended' | 'bunked') => {
			const key = `${courseId}-${slot}`;
			const current = dayRecords.get(key);
			setSaving(key);
			try {
				if (current === status) {
					// Same status clicked → clear the record
					const res = await fetch('/api/attendance/mark', {
						method: 'DELETE',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ course_id: courseId, date: selectedDate, slot }),
					});
					if (!res.ok) {
						const err = await res.json().catch(() => ({}));
						console.error('Clear failed:', res.status, err);
					}
				} else {
					// Different status or no status → set new status
					const res = await fetch('/api/attendance/mark', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ course_id: courseId, date: selectedDate, slot, status }),
					});
					if (!res.ok) {
						const err = await res.json().catch(() => ({}));
						console.error('Mark failed:', res.status, err);
					}
				}
				await onRefresh();
			} catch (e) {
				console.error('Mark error:', e);
			} finally {
				setSaving(null);
			}
		},
		[dayRecords, selectedDate, onRefresh],
	);

	/* Bulk mark all courses for selected date */
	const bulkMark = async (status: 'attended' | 'bunked') => {
		setSaving('bulk');
		try {
			await Promise.all(
				courses.map((course) => {
					const maxSlot = courseSlots[course.id] ?? 1;
					return Promise.all(
						Array.from({ length: maxSlot }, (_, i) =>
							fetch('/api/attendance/mark', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									course_id: course.id,
									date: selectedDate,
									slot: i + 1,
									status,
								}),
							}),
						),
					);
				}),
			);
			await onRefresh();
		} catch {
			/* silent */
		} finally {
			setSaving(null);
		}
	};

	const addSlot = (courseId: number) => {
		const current = courseSlots[courseId] ?? 1;
		setCourseSlots({ ...courseSlots, [courseId]: current + 1 });
	};

	const removeSlot = (courseId: number) => {
		const current = courseSlots[courseId] ?? 1;
		if (current <= 1) return;
		setCourseSlots({ ...courseSlots, [courseId]: current - 1 });
	};

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
			{/* Date selector */}
			<div className="flex items-center gap-3 mb-5">
				<button
					type="button"
					onClick={() => {
						const d = new Date(selectedDate);
						d.setDate(d.getDate() - 1);
						onDateChange(dateStr(d.getFullYear(), d.getMonth(), d.getDate()));
					}}
					className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>
				<input
					type="date"
					value={selectedDate}
					onChange={(e) => onDateChange(e.target.value)}
					max={todayStr()}
					className="form-input text-sm font-mono flex-1"
				/>
				<button
					type="button"
					onClick={() => {
						const d = new Date(selectedDate);
						d.setDate(d.getDate() + 1);
						const next = dateStr(d.getFullYear(), d.getMonth(), d.getDate());
						if (next <= todayStr()) onDateChange(next);
					}}
					className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>

			{selectedDate === todayStr() && (
				<p className="font-mono text-tiny text-neon-green mb-4 uppercase tracking-widest font-bold">
					Today
				</p>
			)}

			{/* Mark all buttons */}
			{courses.length > 0 && (
				<div className="flex gap-2 mb-4">
					<button
						type="button"
						onClick={() => bulkMark('attended')}
						disabled={saving === 'bulk'}
						className="flex items-center gap-1 px-3 py-1.5 border border-neon-green/30 font-mono text-tiny font-bold text-neon-green hover:bg-neon-green/5 transition-colors disabled:opacity-50"
					>
						<Check className="w-3 h-3" /> Mark All Attended
					</button>
					<button
						type="button"
						onClick={() => bulkMark('bunked')}
						disabled={saving === 'bulk'}
						className="flex items-center gap-1 px-3 py-1.5 border border-neon-red/30 font-mono text-tiny font-bold text-neon-red hover:bg-neon-red/5 transition-colors disabled:opacity-50"
					>
						<X className="w-3 h-3" /> Mark All Bunked
					</button>
				</div>
			)}

			{/* Course list */}
			{courses.length === 0 ? (
				<div className="py-16 text-center">
					<CalendarCheck className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
					<p className="font-mono text-sm text-text-muted">No courses added yet</p>
					<p className="font-mono text-tiny text-text-muted mt-1">
						Ask your admin to create courses
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{courses.map((course) => {
						const maxSlot = courseSlots[course.id] ?? 1;
						return (
							<div key={course.id} className="border border-border-hard p-4">
								<div className="flex items-center gap-2 mb-3">
									<div
										className="w-3 h-3 rounded-full shrink-0"
										style={{ backgroundColor: course.color }}
									/>
									<span className="font-mono text-sm font-bold text-text-primary">
										{course.name}
									</span>
									{course.code && (
										<span className="font-mono text-tiny text-text-muted">{course.code}</span>
									)}
								</div>

								{Array.from({ length: maxSlot }, (_, i) => {
									const slot = i + 1;
									const key = `${course.id}-${slot}`;
									const status = dayRecords.get(key);
									const isSaving = saving === key;
									return (
										<div key={slot} className="flex items-center gap-2 mb-2 last:mb-0">
											{maxSlot > 1 && (
												<span className="font-mono text-tiny text-text-muted w-16 shrink-0">
													Slot {slot}
												</span>
											)}
											<button
												type="button"
												onClick={() => markAttendance(course.id, slot, 'attended')}
												disabled={isSaving}
												className={`flex items-center gap-1 px-3 py-1.5 font-mono text-tiny font-bold border transition-all ${status === 'attended' ? 'bg-neon-green/15 border-neon-green/40 text-neon-green' : 'border-border-hard text-text-muted hover:text-neon-green hover:border-neon-green/30'}`}
											>
												<Check className="w-3 h-3" /> Attended
											</button>
											<button
												type="button"
												onClick={() => markAttendance(course.id, slot, 'bunked')}
												disabled={isSaving}
												className={`flex items-center gap-1 px-3 py-1.5 font-mono text-tiny font-bold border transition-all ${status === 'bunked' ? 'bg-neon-red/15 border-neon-red/40 text-neon-red' : 'border-border-hard text-text-muted hover:text-neon-red hover:border-neon-red/30'}`}
											>
												<X className="w-3 h-3" /> Bunked
											</button>
											{isSaving && (
												<div className="w-3 h-3 border border-neon-green/20 border-t-neon-green animate-spin rounded-full" />
											)}
										</div>
									);
								})}

								<div className="flex gap-2 mt-2">
									<button
										type="button"
										onClick={() => addSlot(course.id)}
										className="flex items-center gap-1 font-mono text-tiny text-text-muted hover:text-neon-green transition-colors"
									>
										<Plus className="w-3 h-3" /> Add slot
									</button>
									{(courseSlots[course.id] ?? 1) > 1 && (
										<button
											type="button"
											onClick={() => removeSlot(course.id)}
											className="flex items-center gap-1 font-mono text-tiny text-text-muted hover:text-neon-red transition-colors"
										>
											<Minus className="w-3 h-3" /> Remove slot
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</motion.div>
	);
}
