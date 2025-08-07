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
		hasAuction: v.boolean()
	})
		.index('order', ['order'])
		.index('hasAuction', ['hasAuction']),

	teams: defineTable({
		matchId: v.id('matches'),
		score: v.number(),
		name: v.string(),
		playerIds: v.array(v.id('players')),
		captainId: v.id('players'),
		teamColour: v.optional(v.string())
	}).index('matchId', ['matchId']),

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

	bids: defineTable({
		matchId: v.string(),
		playerId: v.id('players'),
		bidderId: v.id('players'),
		winningBid: v.boolean(),
		amount: v.number(),
		timestamp: v.number()
	})
		.index('playerId', ['playerId'])
		.index('matchId_playerId_winningBid', ['matchId', 'playerId', 'winningBid'])
		.index('matchId_playerId', ['matchId', 'playerId'])
});
