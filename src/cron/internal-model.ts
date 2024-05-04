interface LeaderboardResponse {
	leaderboard: Leaderboard;
}

interface Leaderboard {
	rows: readonly LeaderboardRow[];
	pagination: Pagination;
}

interface LeaderboardRow {
	rank: number;
	rating: number;
	accountid: string;
}

interface Pagination {
	totalPages: number;
	totalSize: number;
}
