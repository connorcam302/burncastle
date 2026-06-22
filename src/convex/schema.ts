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
		hasAuction: v.boolean(),
		participants: v.array(v.id('players'))
	})
		.index('order', ['order'])
		.index('hasAuction', ['hasAuction']),

	auctions: defineTable({
		matchId: v.id('matches'),
		live: v.boolean(),
		auctioneers: v.optional(v.array(v.id('players'))),
		displayedPlayerId: v.union(v.id('players'), v.null())
	}).index('matchId', ['matchId']),

	teams: defineTable({
		matchId: v.id('matches'),
		score: v.number(),
		name: v.string(),
		playerIds: v.array(v.id('players')),
		captainId: v.id('players'),
		teamColour: v.optional(v.string())
	})
		.index('matchId', ['matchId'])
		.index('captainId_matchId', ['captainId', 'matchId']),

	stats: defineTable({
		matchId: v.id('matches'),
		playerId: v.id('players'),
		goals: v.number(),
		assists: v.number(),
		isCaptain: v.boolean(),
		rating: v.number(),
		position: v.string(),
		breakdown: v.string()
	})
		.index('playerId', ['playerId'])
		.index('matchId', ['matchId'])
		.index('playerId_matchId', ['playerId', 'matchId']),

	matchEvents: defineTable({
		matchId: v.id('matches'),
		teamId: v.optional(v.id('teams')),
		playerId: v.optional(v.id('players')),
		assistPlayerId: v.optional(v.id('players')),
		type: v.string(),
		minute: v.number(),
		note: v.optional(v.string())
	})
		.index('matchId', ['matchId'])
		.index('playerId', ['playerId'])
		.index('assistPlayerId', ['assistPlayerId']),

	bids: defineTable({
		matchId: v.id('matches'),
		playerId: v.id('players'),
		bidderId: v.id('players'),
		winningBid: v.boolean(),
		amount: v.number(),
		timestamp: v.number()
	})
		.index('matchId', ['matchId'])
		.index('playerId', ['playerId'])
		.index('matchId_playerId_winningBid', ['matchId', 'playerId', 'winningBid'])
		.index('matchId_playerId', ['matchId', 'playerId'])
});
