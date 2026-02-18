// ── App Domain Types ──

export interface Profile {
	id: string;
	roll_number: number;
	display_name: string;
	cf_handle?: string | null;
	lc_handle?: string | null;
	is_admin: boolean;
	xp: number;
	level: number;
	current_streak: number;
	longest_streak: number;
	streak_shields: number;
	last_solve_date?: string | null;
	push_subscription?: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
}

export interface Badge {
	id: string;
	name: string;
	description: string;
	icon: string;
	category: BadgeCategory;
	condition_type: 'auto' | 'manual';
	condition_value?: Record<string, unknown>;
}

export interface UserBadge {
	id: number;
	user_id: string;
	badge_id: string;
	earned_at: string;
	badge?: Badge;
}

export interface Duel {
	id: number;
	challenger_id: string;
	challenged_id: string;
	problem_id: string;
	time_limit_minutes: number;
	status: DuelStatus;
	winner_id?: string | null;
	challenger_solve_time?: number | null;
	challenged_solve_time?: number | null;
	started_at?: string | null;
	expires_at?: string | null;
	created_at: string;
	// Joined data
	challenger?: Profile;
	challenged?: Profile;
}

export interface BossBattle {
	id: number;
	title: string;
	description?: string | null;
	problem_url: string;
	problem_id?: string | null;
	difficulty_label?: string | null;
	xp_first: number;
	xp_top5: number;
	xp_others: number;
	starts_at: string;
	ends_at: string;
	created_by?: string | null;
	created_at: string;
	// Computed
	solves_count?: number;
	total_hp?: number;
	current_hp?: number;
}

export interface Quest {
	id: number;
	title: string;
	description: string;
	quest_type: QuestType;
	condition: Record<string, unknown>;
	xp_reward: number;
	week_start: string;
	is_admin_curated: boolean;
}

export interface UserQuest {
	id: number;
	user_id: string;
	quest_id: number;
	progress: number;
	completed: boolean;
	completed_at?: string | null;
	quest?: Quest;
}

export interface SharedProblem {
	id: number;
	user_id: string;
	platform: 'cf' | 'lc';
	problem_id?: string | null;
	problem_url: string;
	problem_title: string;
	difficulty?: string | null;
	tags: string[];
	note?: string | null;
	source: 'manual' | 'auto_lc';
	created_at: string;
	// Joined data
	user?: Profile;
	reactions?: ProblemReaction[];
	reaction_counts?: Record<ReactionType, number>;
}

export interface ProblemReaction {
	id: number;
	problem_id: number;
	user_id: string;
	reaction: ReactionType;
	created_at: string;
}

export interface ProblemBookmark {
	id: number;
	user_id: string;
	problem_id: number;
	list_type: BookmarkList;
	solved: boolean;
	created_at: string;
	problem?: SharedProblem;
}

export interface DailyProblem {
	id: number;
	date: string;
	problem_id: string;
	problem_name: string;
	problem_rating?: number | null;
	problem_url: string;
	tags: string[];
	is_admin_curated: boolean;
	created_by?: string | null;
	created_at: string;
	// Computed
	solves_count?: number;
	user_solved?: boolean;
}

export interface Recommendation {
	slot: 'weak' | 'practice' | 'rusty' | 'stretch';
	label: string;
	topic: string;
	problem: import('./codeforces').CFProblem;
	classmates_solved: number;
	days_since_last_solve?: number;
}

export interface AttendanceInsight {
	course_id: number;
	course_name: string;
	attended: number;
	total: number;
	percentage: number;
	skippable: number;
	risk_level: 'safe' | 'warning' | 'danger';
	projected_semester_end: number;
}

export interface Course {
	id: number;
	name: string;
	code?: string | null;
	color: string;
	is_active: boolean;
	created_by?: string | null;
	created_at: string;
}

export interface AttendanceRecord {
	id: number;
	user_id: string;
	course_id: number;
	date: string;
	slot: number;
	status: AttendanceStatus;
	created_at: string;
	course?: Course;
}

export interface FlashcardDeck {
	id: number;
	title: string;
	description?: string | null;
	tags: string[];
	card_count: number;
	created_by?: string | null;
	created_at: string;
}

export interface Flashcard {
	id: number;
	deck_id: number;
	front: string;
	back: string;
	position: number;
	created_at: string;
}

export interface FlashcardProgress {
	id: number;
	user_id: string;
	card_id: number;
	status: 'unseen' | 'got_it' | 'needs_review';
	last_reviewed_at?: string | null;
}

export interface Resource {
	id: number;
	title: string;
	url: string;
	description?: string | null;
	topic: string;
	submitted_by?: string | null;
	approved_by?: string | null;
	status: 'pending' | 'approved' | 'rejected';
	created_at: string;
	submitter?: Profile;
}

export interface Announcement {
	id: number;
	title: string;
	body: string;
	priority: 'normal' | 'important' | 'urgent';
	created_by?: string | null;
	created_at: string;
	creator?: Profile;
}

export interface Notification {
	id: number;
	user_id: string;
	type: string;
	title: string;
	body: string;
	data?: Record<string, unknown>;
	read: boolean;
	push_sent: boolean;
	created_at: string;
}

export interface HallOfFameEntry {
	id: number;
	category: string;
	user_id: string;
	title: string;
	value?: string | null;
	period?: string | null;
	achieved_at: string;
	user?: Profile;
}

export interface XPLogEntry {
	id: number;
	user_id: string;
	amount: number;
	reason: string;
	reference_id?: string | null;
	created_at: string;
}

export interface LeaderboardEntry {
	rank: number;
	profile: Profile;
	xp: number;
	level: number;
	cf_rating?: number | null;
	lc_solved?: number | null;
	streak: number;
	rank_change?: number; // positive = moved up
}

// ── Enums / Union Types ──

export type BadgeCategory = 'solve' | 'streak' | 'social' | 'contest' | 'special';
export type DuelStatus = 'pending' | 'active' | 'completed' | 'expired' | 'declined';
export type QuestType = 'topic' | 'difficulty' | 'streak' | 'social' | 'duel' | 'study';
export type ReactionType = 'fire' | 'brain' | 'skull';
export type AttendanceStatus = 'attended' | 'bunked';
export type BookmarkList = 'want_to_solve' | 'revisit_later';
export type NotificationType =
	| 'overtake'
	| 'dark_horse'
	| 'duel_challenge'
	| 'duel_result'
	| 'boss_new'
	| 'boss_solved'
	| 'badge_earned'
	| 'quest_complete'
	| 'streak_warning'
	| 'streak_lost'
	| 'daily_problem'
	| 'announcement'
	| 'resource_approved'
	| 'weekly_digest';
