export interface Course {
	id: number;
	name: string;
	code: string | null;
	color: string;
	classes_per_week?: number;
}

export interface AttendanceRecord {
	id: number;
	course_id: number;
	date: string;
	slot: number;
	status: 'attended' | 'bunked';
	courses: { id: number; name: string; code: string | null; color: string };
}

export interface AttendanceSummary {
	course_id: number;
	course_name: string;
	course_code: string | null;
	color: string;
	attended: number;
	bunked: number;
	total: number;
	percentage: number;
	skippable: number;
	classes_needed: number;
	risk_level: 'safe' | 'warning' | 'danger';
	projected_end: number;
	safe_to_skip_today: boolean;
	monthly_attended: number;
	monthly_bunked: number;
	monthly_total: number;
	monthly_percentage: number;
	monthly_skippable: number;
}

export const RISK = {
	safe: {
		color: 'text-neon-green',
		bg: 'bg-neon-green/10',
		border: 'border-neon-green/30',
		label: 'SAFE',
	},
	warning: {
		color: 'text-neon-orange',
		bg: 'bg-neon-orange/10',
		border: 'border-neon-orange/30',
		label: 'WARNING',
	},
	danger: {
		color: 'text-neon-red',
		bg: 'bg-neon-red/10',
		border: 'border-neon-red/30',
		label: 'DANGER',
	},
};

export function dateStr(y: number, m: number, d: number) {
	return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function todayStr() {
	const t = new Date();
	return dateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = [
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
