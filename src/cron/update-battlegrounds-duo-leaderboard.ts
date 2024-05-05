/* eslint-disable @typescript-eslint/no-use-before-define */

import { Context } from 'aws-lambda';
import { buildLeaderboards } from './bg-leaderboards-common';

export default async (event, context: Context): Promise<any> => {
	return buildLeaderboards(event, context, 'battlegroundsduo');
};
