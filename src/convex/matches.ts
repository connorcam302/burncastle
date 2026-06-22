import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';

const teamInput = v.object({
	id: v.optional(v.id('teams')),
	name: v.string(),
	score: v.number(),
	captainId: v.id('players'),
	playerIds: v.array(v.id('players')),
	teamColour: v.optional(v.string())
});

const statInput = v.object({
	playerId: v.id('players'),
	isCaptain: v.boolean(),
	rating: v.number(),
	position: v.string(),
	breakdown: v.string()
});

const eventInput = v.object({
	id: v.optional(v.id('matchEvents')),
	type: v.string(),
	minute: v.number(),
	teamIndex: v.optional(v.number()),
	playerId: v.optional(v.id('players')),
	assistPlayerId: v.optional(v.id('players')),
	note: v.optional(v.string())
});

async function getMatchDetails(ctx: QueryCtx, match: Doc<'matches'>) {
	const [teams, stats, events] = await Promise.all([
		ctx.db
			.query('teams')
			.withIndex('matchId', (q) => q.eq('matchId', match._id))
			.collect(),
		ctx.db
			.query('stats')
			.withIndex('matchId', (q) => q.eq('matchId', match._id))
			.collect(),
		ctx.db
			.query('matchEvents')
			.withIndex('matchId', (q) => q.eq('matchId', match._id))
			.collect()
	]);

	const teamsWithCaptains = await Promise.all(
		teams.map(async (team) => {
			const captain = await ctx.db.get(team.captainId);
			return { ...team, captain };
		})
	);

	const statsWithPlayers = await Promise.all(
		stats.map(async (stat) => {
			const player = await ctx.db.get(stat.playerId);
			return { ...stat, player };
		})
	);

	const eventsWithPlayers = await Promise.all(
		events.map(async (event) => {
			const [player, assistPlayer, team] = await Promise.all([
				event.playerId ? ctx.db.get(event.playerId) : null,
				event.assistPlayerId ? ctx.db.get(event.assistPlayerId) : null,
				event.teamId ? ctx.db.get(event.teamId) : null
			]);
			return { ...event, player, assistPlayer, team };
		})
	);

	return {
		...match,
		teams: teamsWithCaptains,
		stats: statsWithPlayers,
		events: eventsWithPlayers.sort((a, b) => a.minute - b.minute)
	};
}

export const getAll = query({
	args: {},
	handler: async (ctx) => {
		const matches = await ctx.db.query('matches').withIndex('order').collect();

		const matchesWithDetails = await Promise.all(
			matches.map(async (match) => getMatchDetails(ctx, match))
		);

		return matchesWithDetails.sort((a, b) => b.order - a.order);
	}
});

export const get = query({
	args: { matchId: v.id('matches') },
	handler: async (ctx, args) => {
		const match = await ctx.db.get(args.matchId);
		if (!match) throw new Error(`Match ${args.matchId} not found`);
		return getMatchDetails(ctx, match);
	}
});

export const save = mutation({
	args: {
		matchId: v.optional(v.id('matches')),
		order: v.number(),
		hasAuction: v.boolean(),
		participants: v.array(v.id('players')),
		teams: v.array(teamInput),
		stats: v.array(statInput),
		events: v.array(eventInput)
	},
	handler: async (ctx, args) => {
		const matchId =
			args.matchId ??
			(await ctx.db.insert('matches', {
				order: args.order,
				hasAuction: args.hasAuction,
				participants: args.participants
			}));

		if (args.matchId) {
			await ctx.db.patch(matchId, {
				order: args.order,
				hasAuction: args.hasAuction,
				participants: args.participants
			});
		}

		const existingTeams = await ctx.db
			.query('teams')
			.withIndex('matchId', (q) => q.eq('matchId', matchId))
			.collect();

		const savedTeamIds = await Promise.all(
			args.teams.map(async (team, index) => {
				const existingTeamId = team.id ?? existingTeams[index]?._id;
				const teamData = {
					matchId,
					name: team.name,
					score: team.score,
					captainId: team.captainId,
					playerIds: team.playerIds,
					teamColour: team.teamColour
				};

				if (existingTeamId) {
					await ctx.db.patch(existingTeamId, teamData);
					return existingTeamId;
				} else {
					return await ctx.db.insert('teams', teamData);
				}
			})
		);

		const goalCounts = new Map<string, number>();
		const assistCounts = new Map<string, number>();
		for (const event of args.events) {
			if (event.type === 'goal' && event.playerId) {
				goalCounts.set(event.playerId, (goalCounts.get(event.playerId) ?? 0) + 1);
			}
			if (event.type === 'goal' && event.assistPlayerId) {
				assistCounts.set(event.assistPlayerId, (assistCounts.get(event.assistPlayerId) ?? 0) + 1);
			}
		}

		await Promise.all(
			args.stats.map(async (stat) => {
				const existingStat = await ctx.db
					.query('stats')
					.withIndex('playerId_matchId', (q) =>
						q.eq('playerId', stat.playerId).eq('matchId', matchId)
					)
					.first();

				const statData = {
					matchId,
					playerId: stat.playerId,
					goals: goalCounts.get(stat.playerId) ?? 0,
					assists: assistCounts.get(stat.playerId) ?? 0,
					isCaptain: stat.isCaptain,
					rating: stat.rating,
					position: stat.position,
					breakdown: stat.breakdown
				};

				if (existingStat) {
					await ctx.db.patch(existingStat._id, statData);
				} else {
					await ctx.db.insert('stats', statData);
				}
			})
		);

		const savedPlayerIds = new Set(args.stats.map((stat) => stat.playerId));
		const existingStats = await ctx.db
			.query('stats')
			.withIndex('matchId', (q) => q.eq('matchId', matchId))
			.collect();

		await Promise.all(
			existingStats
				.filter((stat) => !savedPlayerIds.has(stat.playerId))
				.map((stat) => ctx.db.delete(stat._id))
		);

		const existingEvents = await ctx.db
			.query('matchEvents')
			.withIndex('matchId', (q) => q.eq('matchId', matchId))
			.collect();

		await Promise.all(existingEvents.map((event) => ctx.db.delete(event._id)));
		await Promise.all(
			args.events.map((event) =>
				ctx.db.insert('matchEvents', {
					matchId,
					type: event.type,
					minute: event.minute,
					teamId:
						event.teamIndex !== undefined && savedTeamIds[event.teamIndex]
							? savedTeamIds[event.teamIndex]
							: undefined,
					playerId: event.playerId,
					assistPlayerId: event.assistPlayerId,
					note: event.note
				})
			)
		);

		return matchId;
	}
});
