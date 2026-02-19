// Codeforces API Response Types

export interface CFUser {
	handle: string;
	rating?: number;
	maxRating?: number;
	rank?: string;
	maxRank?: string;
	avatar: string;
	titlePhoto: string;
	contribution?: number;
	friendOfCount?: number;
	registrationTimeSeconds?: number;
}

export interface CFProblem {
	contestId?: number;
	index: string;
	name: string;
	rating?: number;
	tags: string[];
	solvedCount?: number;
}

export interface CFSubmission {
	id: number;
	contestId?: number;
	problem: CFProblem;
	verdict?: string;
	programmingLanguage: string;
	creationTimeSeconds: number;
	participantType?: string;
	testset?: string;
	passedTestCount?: number;
	timeConsumedMillis?: number;
	memoryConsumedBytes?: number;
}

export interface CFRatingChange {
	contestId: number;
	contestName: string;
	handle: string;
	rank: number;
	ratingUpdateTimeSeconds: number;
	oldRating: number;
	newRating: number;
}

export interface CFContest {
	id: number;
	name: string;
	type: "CF" | "IOI" | "ICPC";
	phase:
		| "BEFORE"
		| "CODING"
		| "PENDING_SYSTEM_TEST"
		| "SYSTEM_TEST"
		| "FINISHED";
	frozen: boolean;
	durationSeconds: number;
	startTimeSeconds?: number;
	relativeTimeSeconds?: number;
}

// API response wrapper
export interface CFApiResponse<T> {
	status: "OK" | "FAILED";
	result?: T;
	comment?: string;
}
