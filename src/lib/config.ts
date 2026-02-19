// CO.ARC Site Configuration
// All institution-specific values, branding, and magic strings live here.

export const SITE = {
	name: "CO.ARC",
	tagline: "Competitive Programming Tracker",
	description:
		"Track your Codeforces & LeetCode progress, compete in duels, earn XP & badges. Built for SVNIT AI'25.",
	footer: "CO.ARC • SVNIT AI'25 • Built with ❤️ by AI 2k29",
	url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const INSTITUTION = {
	name: "SVNIT",
	batch: "AI 2k29",
	label: "SVNIT AI 2k29",
	emailDomain: "aid.svnit.ac.in",
	// Prefix before the zero-padded roll number in the email
	emailPrefix: "u25ai0",
	// Regex to extract the 2-digit roll from a full email
	rollExtractRegex: /u25ai0(\d{2})@/,
} as const;

// Roll number constraints
export const ROLL = {
	min: 1,
	max: 70,
	// Build the institutional email from a numeric roll number
	toEmail(roll: number): string {
		const padded = String(roll).padStart(2, "0");
		return `${INSTITUTION.emailPrefix}${padded}@${INSTITUTION.emailDomain}`;
	},
	// Extract roll number from a user email. Returns null if not matched.
	fromEmail(email: string): number | null {
		const match = email.match(INSTITUTION.rollExtractRegex);
		return match ? parseInt(match[1], 10) : null;
	},
	// Validate that a value is a valid roll number
	isValid(value: number): boolean {
		return Number.isInteger(value) && value >= ROLL.min && value <= ROLL.max;
	},
} as const;
