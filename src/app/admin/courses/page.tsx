'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronUp, Palette, Pencil, Plus, Settings, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

/* Types */
interface Course {
	id: number;
	name: string;
	code: string | null;
	color: string;
	is_active: boolean;
	classes_per_week: number;
	semester_end: string | null;
	schedule: Record<string, number> | null;
}

interface CourseForm {
	name: string;
	code: string;
	color: string;
	classes_per_week: number;
	semester_end: string;
	schedule: Record<string, number>;
}

const PRESET_COLORS = [
	'#00f0ff',
	'#ff00aa',
	'#39ff14',
	'#ff6b00',
	'#ff0040',
	'#b44aff',
	'#ffe600',
	'#3b82f6',
	'#f97316',
	'#14b8a6',
	'#ec4899',
	'#8b5cf6',
];

const DAY_LABELS = [
	{ key: '1', label: 'Mon' },
	{ key: '2', label: 'Tue' },
	{ key: '3', label: 'Wed' },
	{ key: '4', label: 'Thu' },
	{ key: '5', label: 'Fri' },
	{ key: '6', label: 'Sat' },
];

const DEFAULT_SCHEDULE: Record<string, number> = { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 };

const DEFAULT_FORM: CourseForm = {
	name: '',
	code: '',
	color: '#00f0ff',
	classes_per_week: 3,
	semester_end: '',
	schedule: { ...DEFAULT_SCHEDULE },
};

/** Pretty-print schedule */
function formatSchedule(schedule: Record<string, number>): string {
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return Object.entries(schedule)
		.sort(([a], [b]) => Number(a) - Number(b))
		.map(([dow, slots]) => {
			const day = dayNames[Number(dow)];
			return slots > 1 ? `${day}×${slots}` : day;
		})
		.join(', ');
}

export default function AdminCoursesPage() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState<CourseForm>({ ...DEFAULT_FORM });
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState('');
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editForm, setEditForm] = useState<CourseForm>({ ...DEFAULT_FORM });
	const [saving, setSaving] = useState(false);

	const fetchCourses = useCallback(async () => {
		try {
			const res = await fetch('/api/attendance/courses');
			if (!res.ok) return;
			const data = await res.json();
			setCourses(data.courses ?? []);
		} catch {
			/* silent */
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchCourses();
	}, [fetchCourses]);

	const createCourse = async () => {
		if (!form.name.trim()) {
			setError('Course name is required');
			return;
		}
		setCreating(true);
		setError('');
		try {
			const res = await fetch('/api/attendance/courses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: form.name,
					code: form.code || null,
					color: form.color,
					classes_per_week: form.classes_per_week,
					semester_end: form.semester_end || null,
					schedule: form.schedule,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				setError(data.error ?? 'Failed to create course');
				return;
			}
			setForm({ ...DEFAULT_FORM });
			setShowForm(false);
			await fetchCourses();
		} catch {
			setError('Network error');
		} finally {
			setCreating(false);
		}
	};

	const deleteCourse = async (courseId: number) => {
		if (!confirm('Delete this course? This cannot be undone.')) return;
		try {
			await fetch(`/api/attendance/courses/${courseId}`, { method: 'DELETE' });
			await fetchCourses();
		} catch {
			/* silent */
		}
	};

	const startEdit = (course: Course) => {
		setEditingId(course.id);
		setEditForm({
			name: course.name,
			code: course.code ?? '',
			color: course.color,
			classes_per_week: course.classes_per_week ?? 3,
			semester_end: course.semester_end ?? '',
			schedule: course.schedule ?? { ...DEFAULT_SCHEDULE },
		});
	};

	const saveEdit = async () => {
		if (!editingId) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/attendance/courses/${editingId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: editForm.name,
					code: editForm.code || null,
					color: editForm.color,
					classes_per_week: editForm.classes_per_week,
					semester_end: editForm.semester_end || null,
					schedule: editForm.schedule,
				}),
			});
			if (res.ok) {
				setEditingId(null);
				await fetchCourses();
			}
		} catch {
			/* silent */
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="px-4 sm:px-8 py-6 sm:py-10 pb-24 sm:pb-10 max-w-[700px] mx-auto relative">
			{/* HEADER */}
			<motion.header
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				className="border-l-2 border-neon-cyan pl-6 mb-8"
			>
				<h1 className="font-heading text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tighter">
					<span className="text-neon-cyan">::</span> Manage Courses
				</h1>
				<p className="text-text-muted text-tiny font-mono mt-1 uppercase tracking-widest font-bold">
					Admin · Create & manage attendance courses
				</p>
			</motion.header>

			{/* Add course button */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="mb-6"
			>
				<button
					type="button"
					onClick={() => setShowForm(!showForm)}
					className="flex items-center gap-1.5 px-4 py-2 bg-neon-green/10 border border-neon-green/30 font-mono text-tiny font-bold text-neon-green hover:bg-neon-green/15 transition-colors"
				>
					{showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{' '}
					{showForm ? 'Hide Form' : 'Add Course'}
				</button>
			</motion.div>

			{/* Create form */}
			<AnimatePresence>
				{showForm && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="mb-6 border border-border-hard p-5 overflow-hidden"
					>
						<CourseFormFields form={form} setForm={setForm} />
						{error && <p className="font-mono text-sm text-neon-red mt-2">{error}</p>}
						<div className="flex gap-2 mt-4">
							<button
								type="button"
								onClick={createCourse}
								disabled={creating}
								className="flex items-center gap-1 px-4 py-2 bg-neon-green/10 border border-neon-green/30 font-mono text-tiny font-bold text-neon-green disabled:opacity-50"
							>
								<Check className="w-3 h-3" /> {creating ? 'Creating...' : 'Create'}
							</button>
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="px-3 py-2 font-mono text-tiny text-text-muted"
							>
								Cancel
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Course list */}
			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
				</div>
			) : courses.length === 0 ? (
				<div className="py-16 text-center">
					<Settings className="w-10 h-10 text-text-muted/20 mx-auto mb-4" />
					<p className="font-mono text-sm text-text-muted">No courses yet</p>
				</div>
			) : (
				<div className="space-y-2">
					{courses.map((course, idx) => (
						<motion.div
							key={course.id}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.04 }}
							className="border border-border-hard"
						>
							{/* Course row */}
							<div className="flex items-center gap-3 p-4">
								<div
									className="w-4 h-4 rounded-full shrink-0"
									style={{ backgroundColor: course.color }}
								/>
								<div className="min-w-0 flex-1">
									<span className="font-mono text-sm font-bold text-text-primary">
										{course.name}
									</span>
									{course.code && (
										<span className="font-mono text-tiny text-text-muted ml-2">{course.code}</span>
									)}
									<div className="flex flex-col gap-0.5 mt-0.5">
										<span className="font-mono text-tiny text-text-muted">
											{formatSchedule(course.schedule ?? DEFAULT_SCHEDULE)}
										</span>
										{course.semester_end && (
											<span className="font-mono text-tiny text-text-muted">
												ends {course.semester_end}
											</span>
										)}
									</div>
								</div>
								<button
									type="button"
									onClick={() => (editingId === course.id ? setEditingId(null) : startEdit(course))}
									className="p-1.5 text-text-muted hover:text-neon-cyan transition-colors"
									title="Edit course"
								>
									{editingId === course.id ? (
										<ChevronUp className="w-3.5 h-3.5" />
									) : (
										<Pencil className="w-3.5 h-3.5" />
									)}
								</button>
								<button
									type="button"
									onClick={() => deleteCourse(course.id)}
									className="p-1.5 text-text-muted hover:text-neon-red transition-colors"
									title="Delete course"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>

							{/* Inline edit form */}
							<AnimatePresence>
								{editingId === course.id && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className="border-t border-border-hard/50 p-4 bg-elevated/30 overflow-hidden"
									>
										<CourseFormFields form={editForm} setForm={setEditForm} />
										<div className="flex gap-2 mt-4">
											<button
												type="button"
												onClick={saveEdit}
												disabled={saving}
												className="flex items-center gap-1 px-3 py-1.5 bg-neon-cyan/10 border border-neon-cyan/30 font-mono text-tiny font-bold text-neon-cyan disabled:opacity-50"
											>
												<Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
											</button>
											<button
												type="button"
												onClick={() => setEditingId(null)}
												className="flex items-center gap-1 px-3 py-1.5 font-mono text-tiny text-text-muted hover:text-text-secondary"
											>
												<X className="w-3 h-3" /> Cancel
											</button>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
}

/* Shared form fields */

function CourseFormFields({
	form,
	setForm,
}: {
	form: CourseForm;
	setForm: (f: CourseForm) => void;
}) {
	const toggleDay = (day: string) => {
		const newSchedule = { ...form.schedule };
		if (day in newSchedule) {
			delete newSchedule[day];
		} else {
			newSchedule[day] = 1;
		}
		setForm({ ...form, schedule: newSchedule });
	};

	const setDaySlots = (day: string, slots: number) => {
		const newSchedule = { ...form.schedule };
		if (slots <= 0) {
			delete newSchedule[day];
		} else {
			newSchedule[day] = slots;
		}
		setForm({ ...form, schedule: newSchedule });
	};

	return (
		<div className="space-y-4">
			<div>
				<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-1 block">
					Course Name *
				</span>
				<input
					type="text"
					value={form.name}
					onChange={(e) => setForm({ ...form, name: e.target.value })}
					placeholder="e.g. Data Structures"
					className="form-input w-full text-sm font-mono"
				/>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div>
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-1 block">
						Course Code
					</span>
					<input
						type="text"
						value={form.code}
						onChange={(e) => setForm({ ...form, code: e.target.value })}
						placeholder="e.g. CS201"
						className="form-input w-full text-sm font-mono"
					/>
				</div>
				<div>
					<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-1 block">
						Semester End Date
					</span>
					<input
						type="date"
						value={form.semester_end}
						onChange={(e) => setForm({ ...form, semester_end: e.target.value })}
						className="form-input w-full text-sm font-mono"
					/>
				</div>
			</div>

			{/* Schedule: Day checkboxes + per-day slot counts */}
			<div>
				<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-2 block">
					Schedule (Days & Slots)
				</span>
				<div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
					{DAY_LABELS.map((d) => {
						const active = d.key in form.schedule;
						const slots = form.schedule[d.key] ?? 0;
						return (
							<div key={d.key} className="text-center">
								<button
									type="button"
									onClick={() => toggleDay(d.key)}
									className={`w-full py-1.5 font-mono text-tiny font-bold border transition-all ${
										active
											? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan'
											: 'border-border-hard text-text-muted hover:border-text-muted'
									}`}
								>
									{d.label}
								</button>
								{active && (
									<div className="flex items-center justify-center gap-1 mt-1">
										<button
											type="button"
											onClick={() => setDaySlots(d.key, Math.max(1, slots - 1))}
											className="text-text-muted hover:text-text-primary text-xs px-1"
										>
											−
										</button>
										<span className="font-mono text-tiny text-text-secondary font-bold tabular-nums min-w-4 text-center">
											{slots}
										</span>
										<button
											type="button"
											onClick={() => setDaySlots(d.key, slots + 1)}
											className="text-text-muted hover:text-text-primary text-xs px-1"
										>
											+
										</button>
									</div>
								)}
							</div>
						);
					})}
				</div>
				<p className="font-mono text-[10px] text-text-dim mt-1.5">
					Click a day to toggle. Use − / + to set slots per day.
				</p>
			</div>

			<div>
				<span className="font-mono text-tiny text-text-muted uppercase tracking-widest font-bold mb-1 block">
					Color
				</span>
				<div className="flex flex-wrap gap-2">
					{PRESET_COLORS.map((c) => (
						<button
							key={c}
							type="button"
							onClick={() => setForm({ ...form, color: c })}
							className={`w-7 h-7 border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
							style={{ backgroundColor: c }}
						/>
					))}
					<div className="flex items-center gap-1.5">
						<Palette className="w-3.5 h-3.5 text-text-muted" />
						<input
							type="color"
							value={form.color}
							onChange={(e) => setForm({ ...form, color: e.target.value })}
							className="w-7 h-7 border-0 p-0 cursor-pointer"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
