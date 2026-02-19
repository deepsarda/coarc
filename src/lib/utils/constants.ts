// co.arc Constants

// XP Rewards
export const XP_REWARDS = {
	SOLVE_PROBLEM: 10,
	SOLVE_DAILY: 25,
	STREAK_PER_DAY_BASE: 5, // multiplied by streak day, capped
	STREAK_PER_DAY_CAP: 50,
	SHARE_PROBLEM: 10,
	DUEL_WIN: 75,
	DUEL_LOSS: 15,
	BOSS_FIRST: 500,
	BOSS_TOP5: 300,
	BOSS_SOLVED: 150,
	QUEST_COMPLETE: 50,
	QUEST_ALL_BONUS: 100,
	FLASHCARD_DECK_FIRST: 30,
	RESOURCE_APPROVED: 20,
	DAILY_LOGIN: 5,
	BADGE_EARNED: 25,
} as const;

// Level Thresholds
export const LEVEL_THRESHOLDS: { level: number; xp: number; title: string }[] =
	[
		{ level: 1, xp: 0, title: "Newbie" },
		{ level: 2, xp: 100, title: "Apprentice" },
		{ level: 3, xp: 250, title: "Coder" },
		{ level: 4, xp: 500, title: "Solver" },
		{ level: 5, xp: 800, title: "Grinder" },
		{ level: 6, xp: 1200, title: "Grinder II" },
		{ level: 7, xp: 1700, title: "Grinder III" },
		{ level: 8, xp: 2300, title: "Warrior" },
		{ level: 9, xp: 2600, title: "Warrior II" },
		{ level: 10, xp: 3000, title: "Veteran" },
		{ level: 11, xp: 3800, title: "Veteran II" },
		{ level: 12, xp: 4800, title: "Veteran III" },
		{ level: 13, xp: 5700, title: "Hunter" },
		{ level: 14, xp: 6500, title: "Hunter II" },
		{ level: 15, xp: 7500, title: "Elite" },
		{ level: 16, xp: 9000, title: "Elite II" },
		{ level: 17, xp: 10500, title: "Elite III" },
		{ level: 18, xp: 12000, title: "Commander" },
		{ level: 19, xp: 13500, title: "Commander II" },
		{ level: 20, xp: 15000, title: "Master" },
		{ level: 25, xp: 25000, title: "Grandmaster" },
		{ level: 30, xp: 40000, title: "Legend" },
		{ level: 35, xp: 60000, title: "Legend II" },
		{ level: 40, xp: 80000, title: "Mythic" },
		{ level: 45, xp: 110000, title: "Mythic II" },
		{ level: 50, xp: 150000, title: "Zer0day" },
	];

// Get level info for a given XP amount
export function getLevelForXP(xp: number): {
	level: number;
	title: string;
	xpForNext: number | null;
	xpProgress: number;
} {
	let current = LEVEL_THRESHOLDS[0];
	let next: typeof current | null = null;

	for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
		if (xp >= LEVEL_THRESHOLDS[i].xp) {
			current = LEVEL_THRESHOLDS[i];
			next = LEVEL_THRESHOLDS[i + 1] ?? null;
		} else {
			break;
		}
	}

	return {
		level: current.level,
		title: current.title,
		xpForNext: next ? next.xp - current.xp : null,
		xpProgress: next ? xp - current.xp : 0,
	};
}

// Rate Limits (per day per user)
export const RATE_LIMITS = {
	SHARE_PROBLEM: 3,
	SEND_DUEL: 5,
	RESOURCE_SUBMISSION: 2,
	PROBLEM_REACTIONS: 50,
	ATTENDANCE_MARKS: 20,
} as const;

// Class size
export const CLASS_SIZE = 70;

// Navigation items
export interface NavItem {
	label: string;
	href: string;
	icon: string; // emoji or icon name
	adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
	{ label: "Dashboard", href: "/dashboard", icon: "⚡" },
	{ label: "Leaderboard", href: "/leaderboard", icon: "🏆" },
	{ label: "Problems", href: "/problems", icon: "💻" },
	{ label: "Daily", href: "/problems/daily", icon: "📅" },
	{ label: "Duels", href: "/duels", icon: "⚔️" },
	{ label: "Boss", href: "/boss", icon: "👹" },
	{ label: "Quests", href: "/quests", icon: "📜" },
	{ label: "Attendance", href: "/attendance", icon: "✅" },
	{ label: "Flashcards", href: "/flashcards", icon: "🃏" },
	{ label: "Resources", href: "/resources", icon: "📚" },
	{ label: "Announcements", href: "/announcements", icon: "📢" },
	{ label: "Hall of Fame", href: "/hall-of-fame", icon: "🏅" },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
	{ label: "Admin", href: "/admin", icon: "🔧", adminOnly: true },
	{ label: "Manage Users", href: "/admin/users", icon: "👥", adminOnly: true },
	{ label: "Courses", href: "/admin/courses", icon: "📖", adminOnly: true },
	{ label: "Set Daily", href: "/admin/daily", icon: "📅", adminOnly: true },
	{ label: "Boss Battles", href: "/admin/boss", icon: "👹", adminOnly: true },
	{ label: "Quests", href: "/admin/quests", icon: "📜", adminOnly: true },
	{
		label: "Flashcards",
		href: "/admin/flashcards",
		icon: "🃏",
		adminOnly: true,
	},
	{ label: "Resources", href: "/admin/resources", icon: "📚", adminOnly: true },
	{
		label: "Announcements",
		href: "/admin/announcements",
		icon: "📢",
		adminOnly: true,
	},
];

// Mobile bottom nav items (5 max)
export const MOBILE_NAV_ITEMS: NavItem[] = [
	{ label: "Home", href: "/dashboard", icon: "⚡" },
	{ label: "Leaderboard", href: "/leaderboard", icon: "🏆" },
	{ label: "Problems", href: "/problems", icon: "💻" },
	{ label: "Duels", href: "/duels", icon: "⚔️" },
	{ label: "Profile", href: "/profile/me", icon: "👤" },
];

// Notification type labels
export const NOTIFICATION_LABELS: Record<
	string,
	{ icon: string; color: string }
> = {
	overtake: { icon: "🔺", color: "neon-red" },
	dark_horse: { icon: "🐴", color: "neon-orange" },
	duel_challenge: { icon: "⚔️", color: "neon-magenta" },
	duel_result: { icon: "🏁", color: "neon-cyan" },
	boss_new: { icon: "👹", color: "neon-red" },
	boss_solved: { icon: "💀", color: "neon-green" },
	badge_earned: { icon: "🏅", color: "neon-orange" },
	quest_complete: { icon: "✅", color: "neon-green" },
	streak_warning: { icon: "🔥", color: "neon-orange" },
	streak_lost: { icon: "💔", color: "neon-red" },
	daily_problem: { icon: "📅", color: "neon-cyan" },
	announcement: { icon: "📢", color: "neon-cyan" },
	resource_approved: { icon: "📚", color: "neon-green" },
	weekly_digest: { icon: "📊", color: "neon-magenta" },
};

// Codeforces rating colors
export const CF_RATING_COLORS: {
	min: number;
	max: number;
	color: string;
	label: string;
}[] = [
	{ min: 0, max: 1199, color: "#808080", label: "Newbie" },
	{ min: 1200, max: 1399, color: "#008000", label: "Pupil" },
	{ min: 1400, max: 1599, color: "#03a89e", label: "Specialist" },
	{ min: 1600, max: 1899, color: "#0000ff", label: "Expert" },
	{ min: 1900, max: 2099, color: "#aa00aa", label: "Candidate Master" },
	{ min: 2100, max: 2299, color: "#ff8c00", label: "Master" },
	{ min: 2300, max: 2399, color: "#ff8c00", label: "International Master" },
	{ min: 2400, max: 2599, color: "#ff0000", label: "Grandmaster" },
	{
		min: 2600,
		max: 2999,
		color: "#ff0000",
		label: "International Grandmaster",
	},
	{ min: 3000, max: 9999, color: "#aa0000", label: "Legendary Grandmaster" },
];

export function getCFRatingColor(rating: number): string {
	const entry = CF_RATING_COLORS.find(
		(r) => rating >= r.min && rating <= r.max,
	);
	return entry?.color ?? "#808080";
}

export function getCFRatingLabel(rating: number): string {
	const entry = CF_RATING_COLORS.find(
		(r) => rating >= r.min && rating <= r.max,
	);
	return entry?.label ?? "Unrated";
}
