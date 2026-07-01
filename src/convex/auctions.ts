import { v } from 'convex/values';
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

export const startDraft = mutation({
	args: {
		order: v.optional(v.number()),
		participants: v.array(v.id('players')),
		captainOneId: v.id('players'),
		captainTwoId: v.id('players'),
		auctioneerIds: v.array(v.id('players')),
		teamOneName: v.string(),
		teamTwoName: v.string(),
		teamOneColour: v.optional(v.string()),
		teamTwoColour: v.optional(v.string()),
		live: v.boolean()
	},
	handler: async (ctx, args) => {
		if (args.captainOneId === args.captainTwoId) {
			throw new Error('Captains must be different players');
		}

		const participants = Array.from(
			new Set([...args.participants, args.captainOneId, args.captainTwoId])
		);

		if (participants.length < 2) {
			throw new Error('An auction needs at least two players');
		}

		const matches = await ctx.db.query('matches').withIndex('order').collect();
		const order = args.order ?? Math.max(0, ...matches.map((match) => match.order)) + 1;
		const existingMatch = matches.find((match) => match.order === order);

		if (existingMatch) {
			throw new Error(`Burncastle ${order} already exists`);
		}

		const matchId = await ctx.db.insert('matches', {
			order,
			hasAuction: true,
			participants
		});

		await Promise.all([
			ctx.db.insert('teams', {
				matchId,
				score: 0,
				name: args.teamOneName.trim() || 'Team 1',
				playerIds: [args.captainOneId],
				captainId: args.captainOneId,
				teamColour: args.teamOneColour || '#5e003f'
			}),
			ctx.db.insert('teams', {
				matchId,
				score: 0,
				name: args.teamTwoName.trim() || 'Team 2',
				playerIds: [args.captainTwoId],
				captainId: args.captainTwoId,
				teamColour: args.teamTwoColour || '#1e2c3a'
			})
		]);

		await ctx.db.insert('auctions', {
			matchId,
			live: args.live,
			auctioneers: Array.from(new Set(args.auctioneerIds)),
			displayedPlayerId: null
		});

		return matchId;
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
