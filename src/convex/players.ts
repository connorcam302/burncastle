import { query } from './_generated/server';

export const getAll = query({
	args: {},
	handler: async (ctx) => {
		const allPlayers = await ctx.db.query('players').collect();
		const allMatches = await ctx.db.query('matches').collect();

		const allPlayersWithStats = await Promise.all(
			allPlayers.map(async (player) => {
				const allStats = await ctx.db
					.query('stats')
					.withIndex('playerId', (q) => q.eq('playerId', player._id))
					.collect();

				const matchesWithStats = await Promise.all(
					allMatches.map(async (match) => {
						const stats = allStats.find((s) => s.matchId === match._id);
						return { ...match, stats };
					})
				).then((matches) => matches.sort((a, b) => a.order - b.order));

				if (matchesWithStats.length === 0) {
					return player;
				}

				return { ...player, stats: matchesWithStats[0].stats };
			})
		);

		return allPlayersWithStats;
	}
});

export const get = query({
	handler: async (ctx) => {
		return ctx.db.query('players').collect();
	}
});
