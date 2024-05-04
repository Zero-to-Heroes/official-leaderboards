import { S3 } from '@firestone-hs/aws-lambda-utils';
import { OfficialLeaderboardResult } from 'src/model/leaderboard';
import { gzipSync } from 'zlib';

export const persistData = async (leaderboards: OfficialLeaderboardResult, s3: S3): Promise<void> => {
	const gzippedMinResult = gzipSync(JSON.stringify(leaderboards));
	const destination = `api/bgs/leaderboards/global.gz.json`;
	await s3.writeFile(gzippedMinResult, 'static.zerotoheroes.com', destination, 'application/json', 'gzip');
};
