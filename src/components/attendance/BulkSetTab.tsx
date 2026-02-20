'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { DateInput } from '@/components/ui/DatePicker';
import type { Course } from './types';

export function BulkSetTab({
	courses,
	onDone,
}: {
	courses: Course[];
	onDone: () => Promise<void>;
}) {
	const [semStart, setSemStart] = useState('2026-01-06');
	const [bulkData, setBulkData] = useState<Record<number, { attended: number; total: number }>>({});
	const [saving, setSaving] = useState(false);
	const [mode, setMode] = useState<'manual' | 'predict'>('predict');
	const [predicted, setPredicted] = useState(false);

	useEffect(() => {
		const data: Record<number, { attended: number; total: number }> = {};
		for (const c of courses) data[c.id] = { attended: 0, total: 0 };
		setBulkData(data);
		setPredicted(false);
	}, [courses]);

	const predictClasses = useCallback(() => {
		if (!semStart) return;
		const [sy, sm, sd] = semStart.split('-').map(Number);
		const start = new Date(sy, sm - 1, sd);
		const now = new Date();
		const updated: Record<number, { attended: number; total: number }> = {};
		for (const c of courses) {
			const schedule = c.schedule ?? { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 };
			let totalClasses = 0;
			const cursor = new Date(start);
			while (cursor <= now) {
				const dow = String(cursor.getDay());
				const slots = schedule[dow] ?? 0;
				totalClasses += slots;
				cursor.setDate(cursor.getDate() + 1);
			}
			updated[c.id] = { attended: totalClasses, total: totalClasses };
		}
		setBulkData(updated);
	}, [semStart, courses]);

	// Auto-predict on first load when courses are available
	useEffect(() => {
		if (courses.length > 0 && !predicted && semStart) {
			setPredicted(true);
			predictClasses();
		}
	}, [courses, predicted, semStart, predictClasses]);

	const saveBulk = async () => {
		setSaving(true);
		try {
			const records = Object.entries(bulkData)
				.filter(([, d]) => d.total > 0)
				.map(([id, d]) => ({
					course_id: Number(id),
					attended: Math.min(d.attended, d.total),
					total: d.total,
				}));
			if (records.length === 0) return;
			const res = await fetch('/api/attendance/bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ records, start_date: semStart || undefined }),
			});
			if (!res.ok) {
				const err = await res.json();
				console.error('Bulk save error:', err);
			}
			await onDone();
		} catch (err) {
			console.error('[BulkSetTab] Failed to fetch courses:', err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
			<div className="border border-border-hard p-4">
				<p className="font-mono text-sm text-text-secondary mb-3">
					Set your attendance in bulk! Enter total classes and how many you attended for each
					course.
				</p>

				<div className="flex gap-2 mb-4">
					<button
						type="button"
						onClick={() => setMode('manual')}
						className={`px-3 py-1.5 font-mono text-tiny font-bold border transition-colors ${mode === 'manual' ? 'border-neon-green/40 text-neon-green bg-neon-green/10' : 'border-border-hard text-text-muted'}`}
					>
						Manual
					</button>
					<button
						type="button"
						onClick={() => setMode('predict')}
						className={`px-3 py-1.5 font-mono text-tiny font-bold border transition-colors ${mode === 'predict' ? 'border-neon-cyan/40 text-neon-cyan bg-neon-cyan/10' : 'border-border-hard text-text-muted'}`}
					>
						From Sem Start
					</button>
				</div>

				{mode === 'predict' && (
					<div className="flex items-center gap-2 mb-4">
						<span className="font-mono text-tiny text-text-muted shrink-0">Semester started:</span>
						<DateInput
							value={semStart}
							min="2026-01-01"
							onChange={(v) => {
								if (v && v < '2026-01-01') return;
								setSemStart(v);
							}}
							className="text-sm font-mono flex-1"
						/>
						<button
							type="button"
							onClick={predictClasses}
							disabled={!semStart}
							className="px-3 py-1.5 border border-neon-cyan/30 font-mono text-tiny font-bold text-neon-cyan hover:bg-neon-cyan/10 transition-colors disabled:opacity-50"
						>
							Predict
						</button>
					</div>
				)}
			</div>

			{courses.map((c) => {
				const data = bulkData[c.id] ?? { attended: 0, total: 0 };
				return (
					<div key={c.id} className="border border-border-hard p-4">
						<div className="flex items-center gap-2 mb-3">
							<div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
							<span className="font-mono text-sm font-bold text-text-primary">{c.name}</span>
							{c.code && <span className="font-mono text-tiny text-text-muted">{c.code}</span>}
							{c.classes_per_week && (
								<span className="font-mono text-tiny text-text-muted ml-auto">
									{c.classes_per_week}/wk
								</span>
							)}
						</div>
						<div className="flex items-center gap-3">
							<div className="flex-1">
								<span className="font-mono text-tiny text-text-muted block mb-1">
									Total Classes
								</span>
								<input
									type="number"
									min={0}
									value={data.total}
									onFocus={(e) => e.target.select()}
									onChange={(e) =>
										setBulkData({ ...bulkData, [c.id]: { ...data, total: Number(e.target.value) } })
									}
									className="form-input w-full text-sm font-mono"
								/>
							</div>
							<div className="flex-1">
								<span className="font-mono text-tiny text-text-muted block mb-1">Attended</span>
								<input
									type="number"
									min={0}
									max={data.total}
									value={data.attended}
									onFocus={(e) => e.target.select()}
									onChange={(e) =>
										setBulkData({
											...bulkData,
											[c.id]: { ...data, attended: Math.min(Number(e.target.value), data.total) },
										})
									}
									className="form-input w-full text-sm font-mono"
								/>
							</div>
							<div className="pt-5">
								<span
									className={`font-mono text-sm font-black tabular-nums ${data.total > 0 && data.attended / data.total >= 0.76 ? 'text-neon-green' : data.total > 0 ? 'text-neon-red' : 'text-text-muted'}`}
								>
									{data.total > 0 ? `${Math.round((data.attended / data.total) * 100)}%` : '--'}
								</span>
							</div>
						</div>
					</div>
				);
			})}

			<button
				type="button"
				onClick={saveBulk}
				disabled={saving}
				className="w-full py-3 bg-neon-green/10 border border-neon-green/30 font-mono text-sm font-bold text-neon-green hover:bg-neon-green/15 transition-colors disabled:opacity-50"
			>
				{saving ? 'Saving...' : 'Save Bulk Attendance'}
			</button>

			<button
				type="button"
				onClick={async () => {
					if (!confirm('Delete ALL your attendance records? This cannot be undone.')) return;
					setSaving(true);
					try {
						await fetch('/api/attendance/reset', { method: 'DELETE' });
						await onDone();
					} catch (err) {
						console.error('[BulkSetTab] Failed to submit bulk attendance:', err);
					} finally {
						setSaving(false);
					}
				}}
				disabled={saving}
				className="w-full py-2 border border-neon-red/20 font-mono text-tiny font-bold text-neon-red/60 hover:text-neon-red hover:bg-neon-red/5 transition-colors disabled:opacity-50"
			>
				Reset All Attendance Data
			</button>
		</motion.div>
	);
}
