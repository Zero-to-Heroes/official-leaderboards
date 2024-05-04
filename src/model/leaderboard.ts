export interface OfficialLeaderboardResult {
	readonly lastUpdate: Date;
	readonly leaderboards: OfficialLeaderboard[];
}

export interface OfficialLeaderboard {
	readonly region: 'US' | 'EU' | 'AP';
	readonly entries: LeaderboardEntry[];
}

export interface LeaderboardEntry {
	readonly rank: number;
	readonly rating: number;
	readonly accountId: string;
}
