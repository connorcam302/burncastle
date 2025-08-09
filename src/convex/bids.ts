import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

export const getOnePlayer = query({
	args: { playerId: v.id('players'), matchId: v.id('matches') },
	handler: async (ctx, args) => {
		const bids = await ctx.db
			.query('bids')
			.withIndex('matchId_playerId', (q) =>
				q.eq('matchId', args.matchId).eq('playerId', args.playerId)
			)
			.collect()
			.then((bids) => bids.sort((a, b) => b.amount - a.amount));

		return bids;
	}
});

export const newBid = mutation({
	args: {
		matchId: v.id('matches'),
		amount: v.number(),
		playerId: v.id('players'),
		bidderId: v.id('players')
	},
	handler: async (ctx, args) => {
		const bids = await ctx.db
			.query('bids')
			.withIndex('matchId_playerId', (q) =>
				q.eq('matchId', args.matchId).eq('playerId', args.playerId)
			)
			.collect()
			.then((bids) => bids.sort((a, b) => b.amount - a.amount));

		const winningBid = bids.find((b) => b.winningBid === true);

		if (bids.length === 0 || (bids[0].amount < args.amount && !winningBid)) {
			await ctx.db.insert('bids', {
				matchId: args.matchId,
				playerId: args.playerId,
				bidderId: args.bidderId,
				winningBid: false,
				amount: args.amount,
				timestamp: Date.now()
			});
		}
	}
});

export const markWinningBid = mutation({
	args: {
		bidId: v.id('bids')
	},
	handler: async (ctx, args) => {
		const bid = await ctx.db.get(args.bidId);

		if (!bid) return;

		const team = await ctx.db
			.query('teams')
			.withIndex('captainId_matchId', (q) =>
				q.eq('captainId', bid.bidderId).eq('matchId', bid.matchId as Id<'matches'>)
			)
			.unique();

		if (!team || !bid?.playerId) return;

		if (team) {
			await ctx.db.patch(args.bidId, { winningBid: true });
			await ctx.db.patch(team._id, { playerIds: [...team.playerIds, bid?.playerId] });
		}
	}
});

export const unmarkWinningBid = mutation({
	args: {
		bidId: v.id('bids')
	},
	handler: async (ctx, args) => {
		const bid = await ctx.db.get(args.bidId);

		if (!bid) return;

		const team = await ctx.db
			.query('teams')
			.withIndex('captainId_matchId', (q) =>
				q.eq('captainId', bid.bidderId).eq('matchId', bid.matchId as Id<'matches'>)
			)
			.unique();

		if (!team || !bid?.playerId) return;

		if (team) {
			await ctx.db.patch(args.bidId, { winningBid: false });
			await ctx.db.patch(team._id, {
				playerIds: team.playerIds.filter((id) => id !== bid?.playerId)
			});
		}
	}
});
