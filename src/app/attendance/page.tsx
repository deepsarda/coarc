'use client';

import { motion } from 'framer-motion';
import { Bell, BellOff, Calendar, CalendarCheck, Grid3x3, ShieldCheck, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AttendanceHeatmap } from '@/components/attendance/AttendanceHeatmap';
import { BulkSetTab } from '@/components/attendance/BulkSetTab';
import { CalendarTab } from '@/components/attendance/CalendarTab';
import { MarkTab } from '@/components/attendance/MarkTab';
import { SkipCalcTab } from '@/components/attendance/SkipCalcTab';
import type { AttendanceRecord, AttendanceSummary, Course } from '@/components/attendance/types';
import { todayStr } from '@/components/attendance/types';
import { useAuthContext } from '@/components/providers/AuthProvider';

/* Page */

export default function AttendancePage() {
	const { profile } = useAuthContext();
	const [courses, setCourses] = useState<Course[]>([]);
	const [records, setRecords] = useState<AttendanceRecord[]>([]);
	const [insights, setInsights] = useState<AttendanceSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState(todayStr());
	const [calMonth, setCalMonth] = useState(new Date().getMonth());
	const [calYear, setCalYear] = useState(new Date().getFullYear());
	const [tab, setTab] = useState<'mark' | 'calendar' | 'skip' | 'heatmap' | 'bulk'>('mark');
	const [reminderOn, setReminderOn] = useState(false);
	const [togglingReminder, setTogglingReminder] = useState(false);

	/* Load initial reminder state from profile */
	useEffect(() => {
		if (profile && 'attendance_reminder' in profile) {
			setReminderOn(!!(profile as Record<string, unknown>).attendance_reminder);
		}
	}, [profile]);

	const toggleReminder = async () => {
		setTogglingReminder(true);
		const newValue = !reminderOn;
		try {
			const res = await fetch('/api/users/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ attendance_reminder: newValue }),
			});
			if (res.ok) setReminderOn(newValue);
		} catch (err) {
			console.error('[Attendance] Failed to toggle reminder:', err);
		} finally {
			setTogglingReminder(false);
		}
	};

	/* Fetch data */
	const fromDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
	const toDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${new Date(calYear, calMonth + 1, 0).getDate()}`;

	/* Fetch only records for current calendar month */
	const fetchRecords = useCallback(async (from: string, to: string) => {
		try {
			const res = await fetch(`/api/attendance/records?from=${from}&to=${to}`);
			const data = await res.json();
			setRecords(data.records ?? []);
		} catch (err) {
			console.error('[Attendance] Failed to fetch attendance records:', err);
		}
	}, []);

	/* Full data load (courses, insights, records) */
	const fetchAll = useCallback(async () => {
		setLoading(true);
		try {
			const [coursesRes, recordsRes, insightsRes] = await Promise.all([
				fetch('/api/attendance/courses'),
				fetch(`/api/attendance/records?from=${fromDate}&to=${toDate}`),
				fetch('/api/attendance/calculator'),
			]);
			const [cData, rData, iData] = await Promise.all([
				coursesRes.json(),
				recordsRes.json(),
				insightsRes.json(),
			]);
			setCourses(cData.courses ?? []);
			setRecords(rData.records ?? []);
			setInsights(iData.insights ?? []);
		} catch (err) {
			console.error('[Attendance] Failed to fetch attendance data:', err);
		} finally {
			setLoading(false);
		}
	}, [fromDate, toDate]);

	/* Initial load */
	const [initialLoaded, setInitialLoaded] = useState(false);
	useEffect(() => {
		if (!initialLoaded) {
			fetchAll().then(() => setInitialLoaded(true));
		}
	}, [fetchAll, initialLoaded]);

	/* On calendar month change only re-fetch records */
	useEffect(() => {
		if (initialLoaded) {
			fetchRecords(fromDate, toDate);
		}
	}, [fromDate, toDate, fetchRecords, initialLoaded]);

	if (loading && courses.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="w-10 h-10 border-2 border-neon-green/20 border-t-neon-green animate-spin" />
			</div>
		);
	}

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[900px] mx-auto relative">
			<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-neon-green/3 rounded-full blur-[150px] pointer-events-none" />

			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-green pl-6 mb-6"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-green">::</span> Attendance
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Track · Calculate · Never drop below 76%
				</p>
				{/* 6pm Reminder Toggle */}
				<button
					type="button"
					onClick={toggleReminder}
					disabled={togglingReminder}
					title={reminderOn ? 'Disable 6pm reminder' : 'Enable 6pm reminder'}
					className={`flex items-center gap-1.5 mt-2 px-3 py-1.5 font-mono text-tiny font-bold border transition-all disabled:opacity-50 ${
						reminderOn
							? 'border-neon-green/40 text-neon-green bg-neon-green/10'
							: 'border-border-hard text-text-muted hover:text-text-secondary'
					}`}
				>
					{reminderOn ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
					{reminderOn ? '6pm Reminder ON' : '6pm Reminder'}
				</button>
			</motion.header>

			{/* TABS */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="flex gap-1 mb-6 border border-border-hard p-1"
			>
				{[
					{
						key: 'mark' as const,
						label: 'Mark',
						icon: <CalendarCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />,
					},
					{
						key: 'bulk' as const,
						label: 'Bulk',
						icon: <Upload className="w-4 h-4 sm:w-3.5 sm:h-3.5" />,
					},
					{
						key: 'calendar' as const,
						label: 'Cal',
						icon: <Calendar className="w-4 h-4 sm:w-3.5 sm:h-3.5" />,
					},
					{
						key: 'heatmap' as const,
						label: 'Heat',
						icon: <Grid3x3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />,
					},
					{
						key: 'skip' as const,
						label: 'Skip',
						icon: <ShieldCheck className="w-4 h-4 sm:w-3.5 sm:h-3.5" />,
					},
				].map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						title={t.label}
						className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-2 font-mono text-tiny uppercase tracking-widest font-bold transition-colors ${
							tab === t.key
								? 'bg-neon-green/10 text-neon-green'
								: 'text-text-muted hover:text-text-secondary'
						}`}
					>
						{t.icon} <span className="hidden sm:inline">{t.label}</span>
					</button>
				))}
			</motion.div>

			{tab === 'mark' && (
				<MarkTab
					courses={courses}
					records={records}
					selectedDate={selectedDate}
					onDateChange={setSelectedDate}
					onRefresh={fetchAll}
				/>
			)}
			{tab === 'bulk' && <BulkSetTab courses={courses} onDone={fetchAll} />}
			{tab === 'calendar' && (
				<CalendarTab
					records={records}
					calMonth={calMonth}
					calYear={calYear}
					onMonthChange={(m, y) => {
						setCalMonth(m);
						setCalYear(y);
					}}
				/>
			)}
			{tab === 'heatmap' && <AttendanceHeatmap />}
			{tab === 'skip' && <SkipCalcTab insights={insights} />}
		</div>
	);
}
