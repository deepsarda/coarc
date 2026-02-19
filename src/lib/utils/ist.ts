const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h 30m in ms

/**
 * Get the current date/time shifted to IST.
 * The returned Date object's UTC methods represent IST values.
 * Use getUTC* methods on the result.
 */
export function nowIST(): Date {
	return new Date(Date.now() + IST_OFFSET_MS);
}

/**
 * Get today's date string in IST as YYYY-MM-DD.
 */
export function todayIST(): string {
	const d = nowIST();
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Get IST midnight (start of today) as an ISO string for DB queries.
 * Returns the UTC timestamp that corresponds to 00:00:00 IST today.
 */
export function todayMidnightIST(): string {
	const ist = nowIST();
	// Build IST midnight, then subtract offset to get true UTC
	const midnightUTC =
		Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS;
	return new Date(midnightUTC).toISOString();
}

/**
 * Get the current IST year and month string as YYYY-MM.
 */
export function currentMonthIST(): string {
	const d = nowIST();
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Convert a UTC timestamp (epoch ms) to YYYY-MM-DD in IST.
 */
export function epochToDateIST(epochMs: number): string {
	const d = new Date(epochMs + IST_OFFSET_MS);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Get yesterday's date string in IST as YYYY-MM-DD.
 */
export function yesterdayIST(): string {
	const d = nowIST();
	d.setUTCDate(d.getUTCDate() - 1);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Get a date N days ago in IST as YYYY-MM-DD.
 */
export function daysAgoIST(n: number): string {
	const d = nowIST();
	d.setUTCDate(d.getUTCDate() - n);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Convert an ISO timestamp string to IST date string YYYY-MM-DD.
 */
export function isoToDateIST(isoStr: string): string {
	const d = new Date(new Date(isoStr).getTime() + IST_OFFSET_MS);
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
