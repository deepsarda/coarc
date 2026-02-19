import type { SupabaseClient } from "@supabase/supabase-js";

export interface AttendanceSummary {
	course_id: number;
	course_name: string;
	course_code: string | null;
	color: string;
	classes_per_week: number;
	semester_end: string | null;
	attended: number;
	bunked: number;
	total: number;
	percentage: number;
	skippable: number;
	classes_needed: number;
	risk_level: "safe" | "warning" | "danger";
	projected_end: number;
	safe_to_skip_today: boolean;
}

const REQUIRED_PERCENTAGE = 0.76;

/**
 * Compute attendance statistics and insights for a user.
 * Uses per-course `classes_per_week` and `semester_end` for accurate projections.
 */
export async function computeAttendanceInsights(
	admin: SupabaseClient,
	userId: string,
): Promise<AttendanceSummary[]> {
	const { data: courses } = await admin
		.from("courses")
		.select("id, name, code, color, classes_per_week, semester_end")
		.eq("is_active", true)
		.order("name");

	if (!courses || courses.length === 0) return [];

	const { data: records } = await admin
		.from("attendance_records")
		.select("course_id, status")
		.eq("user_id", userId);

	const recordsByCourse = new Map<
		number,
		{ attended: number; bunked: number }
	>();

	for (const r of records ?? []) {
		const existing = recordsByCourse.get(r.course_id) ?? {
			attended: 0,
			bunked: 0,
		};
		if (r.status === "attended") {
			existing.attended++;
		} else {
			existing.bunked++;
		}
		recordsByCourse.set(r.course_id, existing);
	}

	const now = new Date();

	return courses.map((course) => {
		const stats = recordsByCourse.get(course.id) ?? {
			attended: 0,
			bunked: 0,
		};
		const total = stats.attended + stats.bunked;
		const percentage = total > 0 ? stats.attended / total : 1;

		// Skip calculator: how many more can I skip?
		const skippable =
			total > 0
				? Math.max(
						0,
						Math.floor(
							(stats.attended - REQUIRED_PERCENTAGE * total) /
								REQUIRED_PERCENTAGE,
						),
					)
				: 0;

		// Classes needed to recover
		const classesNeeded =
			percentage < REQUIRED_PERCENTAGE && total > 0
				? Math.ceil(
						(REQUIRED_PERCENTAGE * total - stats.attended) /
							(1 - REQUIRED_PERCENTAGE),
					)
				: 0;

		// Risk level
		let riskLevel: "safe" | "warning" | "danger" = "safe";
		if (percentage < REQUIRED_PERCENTAGE) {
			riskLevel = "danger";
		} else if (percentage < 0.8) {
			riskLevel = "warning";
		}

		// Compute remaining classes dynamically from course settings
		const classesPerWeek = course.classes_per_week ?? 3;
		let remainingClasses: number;

		if (course.semester_end) {
			const semEnd = new Date(course.semester_end);
			const weeksRemaining = Math.max(
				0,
				(semEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7),
			);
			remainingClasses = Math.round(weeksRemaining * classesPerWeek);
		} else {
			// Fallback: assume ~10 weeks remaining
			remainingClasses = classesPerWeek * 10;
		}

		const projectedAttend = stats.attended + remainingClasses * percentage;
		const projectedTotal = total + remainingClasses;
		const projectedEnd =
			projectedTotal > 0 ? projectedAttend / projectedTotal : 1;

		// Safe to skip today?
		const afterSkip = total + 1 > 0 ? stats.attended / (total + 1) : 0;
		const safeToSkipToday = afterSkip >= REQUIRED_PERCENTAGE;

		return {
			course_id: course.id,
			course_name: course.name,
			course_code: course.code,
			color: course.color,
			classes_per_week: classesPerWeek,
			semester_end: course.semester_end,
			attended: stats.attended,
			bunked: stats.bunked,
			total,
			percentage: Math.round(percentage * 1000) / 10,
			skippable,
			classes_needed: classesNeeded,
			risk_level: riskLevel,
			projected_end: Math.round(projectedEnd * 1000) / 10,
			safe_to_skip_today: safeToSkipToday,
		};
	});
}
