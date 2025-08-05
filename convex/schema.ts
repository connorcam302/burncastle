import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	players: defineTable({
		name: v.string(),
		nickname: v.optional(v.string()),
		email: v.optional(v.string())
	}),

	matches: defineTable({
		date: v.string(), // ISO date
		teamOneId: v.id('teams'),
		teamTwoId: v.id('teams'),
		teamOneScore: v.number(),
		teamTwoScore: v.number()
	}),

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
		isCaptain: v.optional(v.boolean())
	}),

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
