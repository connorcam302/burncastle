import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

export const getAll = query({
	args: {},
	handler: async (ctx) => {
		const allMatches = await ctx.db
			.query('matches')
			.withIndex('hasAuction', (q) => q.eq('hasAuction', true))
			.collect();

		const allAuctions = await Promise.all(
			allMatches.map(async (match) => {
				const teams = await ctx.db
					.query('teams')
					.withIndex('matchId', (q) => q.eq('matchId', match._id))
					.collect();

				const teamsWithCaptains = await Promise.all(
					teams.map(async (team) => {
						const captain = await ctx.db
							.query('players')
							.withIndex('by_id', (q) => q.eq('_id', team.captainId))
							.first();
						return { ...team, captain };
					})
				);

				return { ...match, teams: teamsWithCaptains };
			})
		);

		return allAuctions.sort((a, b) => b.order - a.order);
	}
});

export const get = query({
	args: { matchId: v.id('matches') },
	handler: async (ctx, args) => {
		const match = await ctx.db
			.query('matches')
			.withIndex('by_id', (q) => q.eq('_id', args.matchId))
			.first();
		if (match === undefined || match?.hasAuction === false || match === null) {
			throw new Error(`Match ${args.matchId} not found`);
		}

		const bids = await ctx.db
			.query('bids')
			.withIndex('matchId', (q) => q.eq('matchId', match._id))
			.collect();

		const teams = await ctx.db
			.query('teams')
			.withIndex('matchId', (q) => q.eq('matchId', match._id))
			.collect();

		const auction = await ctx.db
			.query('auctions')
			.withIndex('matchId', (q) => q.eq('matchId', match._id))
			.first();

		const teamsWithCaptains = await Promise.all(
			teams.map(async (team) => {
				const captain = await ctx.db
					.query('players')
					.withIndex('by_id', (q) => q.eq('_id', team.captainId))
					.first();
				return { ...team, captain };
			})
		);

		return { ...match, teams: teamsWithCaptains, bids, auction };
	}
});

export const setDisplayedPlayer = mutation({
	args: { auctionId: v.id('auctions'), playerId: v.union(v.id('players'), v.null()) },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.auctionId, {
			displayedPlayerId: args.playerId
		});
	}
});

export const setAuction = mutation({
	args: { auctionId: v.id('auctions'), live: v.boolean() },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.auctionId, {
			live: args.live
		});
	}
});
