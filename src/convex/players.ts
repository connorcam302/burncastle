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
						const [winningBid, goalEvents, assistEvents] = await Promise.all([
							ctx.db
								.query('bids')
								.withIndex('matchId_playerId_winningBid', (q) =>
									q.eq('matchId', match._id).eq('playerId', player._id).eq('winningBid', true)
								)
								.first(),
							ctx.db
								.query('matchEvents')
								.withIndex('playerId', (q) => q.eq('playerId', player._id))
								.filter((q) => q.eq(q.field('matchId'), match._id))
								.collect(),
							ctx.db
								.query('matchEvents')
								.withIndex('assistPlayerId', (q) => q.eq('assistPlayerId', player._id))
								.filter((q) => q.eq(q.field('matchId'), match._id))
								.collect()
						]);

						return {
							...match,
							stats,
							eventGoals: goalEvents.filter((event) => event.type === 'goal').length,
							eventAssists: assistEvents.filter((event) => event.type === 'goal').length,
							price: winningBid?.amount
						};
					})
				);

				return {
					...player,
					stats: matchesWithStats
						.flatMap((match) =>
							match.stats === undefined
								? []
								: [
										{
											...match.stats,
											goals: match.eventGoals || match.stats.goals,
											assists: match.eventAssists || match.stats.assists,
											order: match.order,
											price: match.price
										}
									]
						)
						.sort((a, b) => b.order - a.order)
				};
			})
		);

		return allPlayersWithStats.sort((a, b) => (b.stats[0]?.rating ?? 0) - (a.stats[0]?.rating ?? 0));
	}
});

export const get = query({
	handler: async (ctx) => {
		return ctx.db.query('players').collect();
	}
});
