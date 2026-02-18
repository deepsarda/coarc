// ── LeetCode GraphQL Response Types ──

export interface LCUserProfile {
	username: string;
	submitStats: {
		acSubmissionNum: {
			difficulty: 'All' | 'Easy' | 'Medium' | 'Hard';
			count: number;
			submissions: number;
		}[];
	};
	userContestRanking?: {
		rating: number;
		globalRanking: number;
		attendedContestsCount: number;
		topPercentage: number;
	};
	submissionCalendar: string; // JSON string of {timestamp: count}
}

export interface LCRecentSubmission {
	title: string;
	titleSlug: string;
	timestamp: string;
	statusDisplay: string;
	lang: string;
}

export interface LCProblem {
	questionId: string;
	title: string;
	titleSlug: string;
	difficulty: 'Easy' | 'Medium' | 'Hard';
	topicTags: { name: string; slug: string }[];
	acRate: number;
	isPaidOnly: boolean;
}

export interface LCContestInfo {
	title: string;
	startTime: number;
	duration: number;
	isVirtual: boolean;
}

// GraphQL query names
export type LCQueryType =
	| 'userProfile'
	| 'recentSubmissions'
	| 'contestRanking'
	| 'submissionCalendar';
