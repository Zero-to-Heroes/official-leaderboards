/* eslint-disable @typescript-eslint/no-use-before-define */

import { S3, logBeforeTimeout, sleep } from '@firestone-hs/aws-lambda-utils';
import { logger } from '@firestone-hs/aws-lambda-utils/dist/services/logger';
import { Context } from 'aws-lambda';
import { LeaderboardEntry, OfficialLeaderboard, OfficialLeaderboardResult } from 'src/model/leaderboard';
import { persistData } from './s3-saver';

const regions = ['US', 'EU', 'AP'];
const batchSize = 20;

// This example demonstrates a NodeJS 8.10 async handler[1], however of course you could use
// the more traditional callback-style handler.
// [1]: https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/
export default async (event, context: Context): Promise<any> => {
	const cleanup = logBeforeTimeout(context);
	logger.debug('received message', event);

	const result: OfficialLeaderboardResult = {
		leaderboards: [],
		lastUpdate: new Date(),
	};
	for (let i = 0; i < regions.length; i++) {
		const leaderboardForRegion: OfficialLeaderboard = {
			region: regions[i] as 'US' | 'EU' | 'AP',
			entries: [],
		};
		result.leaderboards.push(leaderboardForRegion);
		const region = regions[i];
		const totalPages = await getTotalPages(region);
		let currentPage = 1;
		while (currentPage <= totalPages) {
			const chunkSize = Math.min(batchSize, totalPages - currentPage + 1);
			const urls = [];
			for (let i = 0; i < chunkSize; i++) {
				urls.push(
					`https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=battlegrounds&page=${
						currentPage + i
					}`,
				);
			}
			console.debug('fetching', region, `${currentPage}/${totalPages}`, chunkSize);
			let rawResults: readonly string[] = null;
			try {
				const responses = await Promise.all(urls.map((url) => fetch(url)));
				rawResults = await Promise.all(responses.map((response) => response.text()));
				const results: LeaderboardResponse[] = rawResults.map((rawResult) => JSON.parse(rawResult));
				for (const result of results) {
					const rows = result.leaderboard.rows;
					for (const row of rows) {
						const entry: LeaderboardEntry = {
							accountId: row.accountid,
							rank: row.rank,
							rating: row.rating,
						};
						leaderboardForRegion.entries.push(entry);
					}
				}
				currentPage += chunkSize;
			} catch (e) {
				console.error('Could not fetch leaderboard, pausing before retry', e, rawResults);
				await sleep(60_000);
			}
		}
		leaderboardForRegion.entries.sort((a, b) => a.rank - b.rank);
	}
	await persistData(result, new S3());

	cleanup();
	return { statusCode: 200, body: '' };
};

const getTotalPages = async (region: string): Promise<number> => {
	const url = `https://hearthstone.blizzard.com/en-us/api/community/leaderboardsData?region=${region}&leaderboardId=battlegrounds&page=1`;
	const response = await fetch(url);
	const result: LeaderboardResponse = await response.json();
	return result.leaderboard.pagination.totalPages;
};
