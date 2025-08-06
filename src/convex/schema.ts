import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	players: defineTable({
		nameId: v.string(),
		name: v.string(),
		nickname: v.optional(v.string()),
		email: v.optional(v.string())
	}),

	matches: defineTable({
		order: v.number(),
		teamOneId: v.optional(v.id('teams')),
		teamTwoId: v.optional(v.id('teams')),
		teamOneScore: v.number(),
		teamTwoScore: v.number()
	}).index('order', ['order']),

	teams: defineTable({
		matchId: v.id('matches'),
		name: v.string(),
		playerIds: v.array(v.id('players'))
	}),

	stats: defineTable({
		matchId: v.id('matches'),
		playerId: v.id('players'),
		goals: v.number(),
		assists: v.number(),
		isCaptain: v.boolean(),
		rating: v.number(),
		position: v.string(),
		breakdown: v.string()
	}).index('playerId', ['playerId']),

	auctions: defineTable({
		matchId: v.id('matches'),
		captainOneId: v.id('players'),
		captainTwoId: v.id('players'),
		finished: v.boolean()
	}),

	bids: defineTable({
		auctionId: v.id('auctions'),
		playerId: v.id('players'), // player being bid on
		bidderId: v.id('players'), // captain bidding
		amount: v.number(),
		timestamp: v.number()
	}),

	assignments: defineTable({
		auctionId: v.id('auctions'),
		playerId: v.id('players'),
		assignedToCaptainId: v.id('players')
	})
});
