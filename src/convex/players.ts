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
						const winningBid = await ctx.db
							.query('bids')
							.withIndex('matchId_playerId_winningBid', (q) =>
								q.eq('matchId', match._id).eq('playerId', player._id).eq('winningBid', true)
							)
							.first();

						return { ...match, stats, price: winningBid?.amount };
					})
				).then((matches) =>
					matches.sort((a, b) => b.order - a.order).filter((m) => m.stats !== undefined)
				);

				if (matchesWithStats.length === 0) {
					return player;
				}

				return {
					...player,
					stats: matchesWithStats.map((m) => {
						return { order: m.order, ...m.stats, price: m.price };
					})
				};
			})
		);

		// @ts-expect-error stat unknown
		return allPlayersWithStats.sort((a, b) => b.stats[0]?.rating - a.stats[0]?.rating);
	}
});

export const get = query({
	handler: async (ctx) => {
		return ctx.db.query('players').collect();
	}
});
