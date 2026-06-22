<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import type { FunctionReturnType } from 'convex/server';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import {
		ArrowLeft,
		ArrowLeftRight,
		BadgeAlert,
		CircleDot,
		CirclePause,
		Flag,
		RectangleVertical,
		StickyNote
	} from '@lucide/svelte';
	import FootballBootIcon from '$lib/components/icons/FootballBootIcon.svelte';
	import FootballIcon from '$lib/components/icons/FootballIcon.svelte';

	type Match = FunctionReturnType<typeof api.matches.get>;
	type MatchEvent = Match['events'][number];
	type MatchStat = Match['stats'][number];

	let { data } = $props();
	const matchId = data.matchId as Id<'matches'>;
	const matchQuery = $derived(useQuery(api.matches.get, { matchId }));
	const match = $derived(matchQuery.data);
	let cardMode = $state<'simple' | 'details'>('simple');

	function playerName(player?: MatchEvent['player'] | MatchEvent['assistPlayer'] | null) {
		return player?.name ?? 'Unknown player';
	}

	function eventLabel(event: MatchEvent) {
		if (event.type === 'goal') return 'Goal';
		if (event.type === 'yellow_card') return 'Yellow Card';
		if (event.type === 'red_card') return 'Red Card';
		if (event.type === 'penalty') return 'Penalty';
		if (event.type === 'position_change') return 'Position Change';
		if (event.type === 'break') return 'Break In Play';
		return 'Note';
	}

	function eventTone(event: MatchEvent) {
		if (event.type === 'goal') return 'border-green-500/40 bg-green-950/30 text-green-200';
		if (event.type === 'yellow_card') return 'border-yellow-400/40 bg-yellow-950/20 text-yellow-200';
		if (event.type === 'red_card') return 'border-red-500/40 bg-red-950/30 text-red-200';
		if (event.type === 'position_change') return 'border-blue-400/40 bg-blue-950/30 text-blue-200';
		if (event.type === 'break') return 'border-highlight/40 bg-yellow-950/20 text-highlight';
		return 'border-zinc-700 bg-zinc-900/50 text-zinc-200';
	}

	function eventMarkerTone(event: MatchEvent) {
		if (event.type === 'goal') return 'border-green-400 bg-green-400 text-zinc-950';
		if (event.type === 'yellow_card') return 'border-yellow-300 bg-yellow-300 text-zinc-950';
		if (event.type === 'red_card') return 'border-red-500 bg-red-500 text-white';
		if (event.type === 'penalty') return 'border-purple-300 bg-purple-300 text-zinc-950';
		if (event.type === 'position_change') return 'border-blue-300 bg-blue-300 text-zinc-950';
		if (event.type === 'break') return 'border-highlight bg-highlight text-zinc-950';
		return 'border-zinc-500 bg-zinc-800 text-zinc-100';
	}

	function eventTeamIndex(event: MatchEvent) {
		if (!match || !event.teamId) return undefined;
		if (event.teamId === match.teams[0]?._id) return 0;
		if (event.teamId === match.teams[1]?._id) return 1;
		return undefined;
	}

	function eventCardPlacement(event: MatchEvent) {
		if (event.type === 'break') return 'col-start-1 col-span-3 text-center justify-self-stretch';
		const teamIndex = eventTeamIndex(event);
		if (teamIndex === 0) return 'col-start-1 text-right justify-self-end max-w-lg';
		if (teamIndex === 1) return 'col-start-3 text-left justify-self-start max-w-lg';
		return 'col-start-1 col-span-3 text-center justify-self-center max-w-md';
	}

	function eventContentJustify(event: MatchEvent) {
		if (event.type === 'break') return 'justify-center';
		const teamIndex = eventTeamIndex(event);
		if (teamIndex === 0) return 'justify-end';
		if (teamIndex === 1) return 'justify-start';
		return 'justify-center';
	}

	function eventScoreText(score: number[]) {
		return `(${score[0]}-${score[1]})`;
	}

	function eventSummary(event: MatchEvent) {
		if (event.type === 'break') return event.note ?? '';
		if (event.type === 'note') return event.note ?? '';
		if (event.type === 'position_change') {
			return [playerName(event.player), event.note].filter(Boolean).join(' -> ');
		}
		if (event.type === 'goal') return '';
		return event.player ? playerName(event.player) : (event.note ?? '');
	}

	function statForPlayer(playerId: Id<'players'>) {
		return match?.stats.find((stat) => stat.playerId === playerId);
	}

	function teamStats(teamIndex: number) {
		const team = match?.teams[teamIndex];
		if (!team) return [];
		return team.playerIds
			.map((playerId) => statForPlayer(playerId))
			.filter(Boolean)
			.sort((a, b) => {
				if (!a || !b) return 0;
				return (b.rating ?? 0) - (a.rating ?? 0);
			}) as MatchStat[];
	}

	function goalsForTeam(teamId?: Id<'teams'>) {
		return match?.events.filter((event) => event.type === 'goal' && event.teamId === teamId) ?? [];
	}

	function scoreAtEvent(eventIndex: number) {
		const score = [0, 0];
		if (!match) return score;

		for (const event of match.events.slice(0, eventIndex + 1)) {
			if (event.type !== 'goal') continue;
			if (event.teamId === match.teams[0]?._id) score[0] += 1;
			if (event.teamId === match.teams[1]?._id) score[1] += 1;
		}

		return score;
	}

	function readBreakdown(breakdown: string) {
		try {
			return JSON.parse(breakdown) as Record<string, number>;
		} catch {
			return {};
		}
	}

	function detailRows(stat: MatchStat) {
		const breakdown = readBreakdown(stat.breakdown);
		if (breakdown.diving !== undefined || breakdown.handling !== undefined) {
			return [
				['DIV', breakdown.diving ?? 0],
				['HAN', breakdown.handling ?? 0],
				['KIC', breakdown.kicking ?? 0],
				['REF', breakdown.reflexes ?? 0],
				['SPE', breakdown.speed ?? 0],
				['POS', breakdown.positioning ?? 0]
			];
		}

		return [
			['PAC', breakdown.pace ?? 0],
			['SHO', breakdown.shooting ?? 0],
			['PAS', breakdown.passing ?? 0],
			['DRI', breakdown.dribbling ?? 0],
			['DEF', breakdown.defending ?? 0],
			['PHY', breakdown.physical ?? 0]
		];
	}

	function cardColour(rating: number) {
		if (rating >= 65) return 'from-amber-200 via-yellow-400 to-yellow-600';
		if (rating >= 60) return 'from-gray-200 via-gray-300 to-gray-500';
		return 'from-orange-300 via-amber-700 to-amber-900';
	}

	function statIcons(count: number) {
		return Array.from({ length: Math.min(3, Math.max(0, count)) });
	}

	function hasExtraStatIcons(count: number) {
		return count > 3;
	}

	function extraStatIconCount(count: number) {
		return Math.max(0, count - 3);
	}

	function hasGoalContributions(stat: MatchStat) {
		return stat.goals > 0 || stat.assists > 0;
	}

	function positionLine(position: string) {
		const pos = position.toUpperCase();
		if (pos.includes('GK')) return 'gk';
		if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DEF'].some((part) => pos.includes(part))) return 'def';
		if (['CDM', 'CM', 'LM', 'RM'].some((part) => pos.includes(part))) return 'mid';
		if (['CAM', 'LW', 'RW', 'LAM', 'RAM'].some((part) => pos.includes(part))) return 'att';
		return 'fwd';
	}

	function lineDepth(line: string) {
		if (line === 'gk') return 9;
		if (line === 'def') return 30;
		if (line === 'mid') return 53;
		if (line === 'att') return 73;
		return 82;
	}

	function lineOrder(line: string) {
		if (line === 'gk') return 0;
		if (line === 'def') return 1;
		if (line === 'mid') return 2;
		if (line === 'att') return 3;
		return 4;
	}

	function positionSide(position: string) {
		const pos = position.toUpperCase();
		if (pos.includes('LWB') || pos.includes('LB') || pos.includes('LW') || pos.includes('LM')) return 18;
		if (pos.includes('LCB') || pos.includes('LCM') || pos.includes('LAM') || pos.includes('LS')) return 34;
		if (pos.includes('RWB') || pos.includes('RB') || pos.includes('RW') || pos.includes('RM')) return 82;
		if (pos.includes('RCB') || pos.includes('RCM') || pos.includes('RAM') || pos.includes('RS')) return 66;
		return 50;
	}

	function normalisePosition(position: string) {
		return position.trim().toUpperCase() || 'UNSET';
	}

	function spreadPositionGroup(groupStats: MatchStat[]) {
		const orderedStats = groupStats
			.slice()
			.sort((a, b) => (a.player?.name ?? '').localeCompare(b.player?.name ?? ''));
		const anchor = positionSide(orderedStats[0]?.position ?? '');
		const count = orderedStats.length;
		const span = Math.min(60, Math.max(0, (count - 1) * 18));
		const start = anchor - span / 2;
		const overflow = Math.max(0, start + span - 88);
		const underflow = Math.max(0, 12 - (start - overflow));
		const offsetStart = start - overflow + underflow;

		return orderedStats.map((stat, index) => ({
			stat,
			side: count === 1 ? Math.min(88, Math.max(12, anchor)) : offsetStart + (span / (count - 1)) * index
		}));
	}

	function spreadLine(lineStats: MatchStat[]) {
		const positionGroups = new Map<string, MatchStat[]>();
		for (const stat of lineStats) {
			const position = normalisePosition(stat.position);
			positionGroups.set(position, [...(positionGroups.get(position) ?? []), stat]);
		}

		return [...positionGroups.values()]
			.sort((a, b) => positionSide(a[0]?.position ?? '') - positionSide(b[0]?.position ?? ''))
			.flatMap((groupStats) => spreadPositionGroup(groupStats));
	}

	function pitchX(teamIndex: number, line: string) {
		const depth = lineDepth(line);
		const halfDepth = 4 + depth * 0.48;
		return teamIndex === 0 ? halfDepth : 100 - halfDepth;
	}

	function pitchY(teamIndex: number, side: number) {
		return teamIndex === 0 ? side : 100 - side;
	}

	function positionedStats(teamIndex: number) {
		const lines = new Map<string, MatchStat[]>();
		for (const stat of teamStats(teamIndex)) {
			const line = positionLine(stat.position);
			lines.set(line, [...(lines.get(line) ?? []), stat]);
		}

		return [...lines.entries()]
			.sort(([a], [b]) => lineOrder(a) - lineOrder(b))
			.flatMap(([line, lineStats]) =>
				spreadLine(lineStats).map((placement) => ({
						stat: placement.stat,
						x: pitchX(teamIndex, line),
						y: pitchY(teamIndex, placement.side)
					})
				)
			);
	}
</script>

<div class="w-full text-white flex flex-col gap-4">
	<a
		href="/matches"
		class="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors w-fit"
	>
		<ArrowLeft size={18} />
		Matches
	</a>

	{#if matchQuery.error}
		<div class="bg-red-950/60 border-2 border-red-500/50 p-4 normal-case">
			<div class="font-bold uppercase">Could not load match</div>
			<div>{matchQuery.error.message}</div>
		</div>
	{:else if matchQuery.isLoading || !match}
		<div class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-6">Loading match...</div>
	{:else}
		<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4 flex flex-col gap-5">
			<div class="text-center">
				<div class="text-zinc-300">Burncastle</div>
				<div class="text-5xl font-bold">{match.order}</div>
			</div>

			<div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
				<div class="flex flex-col md:flex-row gap-3 items-center justify-end text-right">
					<div>
						<div class="text-3xl font-bold">{match.teams[0]?.name ?? 'Team 1'}</div>
						<div class="text-zinc-300 normal-case">
							{playerName(match.teams[0]?.captain)} captain
						</div>
					</div>
					{#if match.teams[0]?.captain}
						<img
							src={`/players/${match.teams[0].captain.nameId}.png`}
							alt={match.teams[0].captain.name}
							class="w-20 h-20"
						/>
					{/if}
				</div>

				<div class="flex items-center justify-center gap-3 px-4">
					<div
						class="w-20 h-20 flex items-center justify-center text-5xl font-bold"
						style="background-color: {match.teams[0]?.teamColour ?? '#5e003f'};"
					>
						{match.teams[0]?.score ?? goalsForTeam(match.teams[0]?._id).length}
					</div>
					<div class="text-5xl font-bold">-</div>
					<div
						class="w-20 h-20 flex items-center justify-center text-5xl font-bold"
						style="background-color: {match.teams[1]?.teamColour ?? '#1e2c3a'};"
					>
						{match.teams[1]?.score ?? goalsForTeam(match.teams[1]?._id).length}
					</div>
				</div>

				<div class="flex flex-col md:flex-row-reverse gap-3 items-center justify-start">
					<div>
						<div class="text-3xl font-bold">{match.teams[1]?.name ?? 'Team 2'}</div>
						<div class="text-zinc-300 normal-case">
							{playerName(match.teams[1]?.captain)} captain
						</div>
					</div>
					{#if match.teams[1]?.captain}
						<img
							src={`/players/${match.teams[1].captain.nameId}.png`}
							alt={match.teams[1].captain.name}
							class="w-20 h-20"
						/>
					{/if}
				</div>
			</div>
		</section>

		<div class="flex flex-col gap-4">
			<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4 flex flex-col gap-4">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
					<div>
						<div class="text-2xl font-bold">Lineups</div>
						<div class="text-zinc-300 normal-case">Players arranged by their match position.</div>
					</div>
					<div class="flex bg-zinc-950/70 border border-zinc-700 w-fit">
						<button
							class="px-3 py-2 uppercase text-sm cursor-pointer {cardMode === 'simple'
								? 'bg-highlight text-zinc-950 font-bold'
								: 'text-zinc-300 hover:text-white'}"
							onclick={() => (cardMode = 'simple')}
						>
							Simple
						</button>
						<button
							class="px-3 py-2 uppercase text-sm cursor-pointer {cardMode === 'details'
								? 'bg-highlight text-zinc-950 font-bold'
								: 'text-zinc-300 hover:text-white'}"
							onclick={() => (cardMode = 'details')}
						>
							Details
						</button>
					</div>
				</div>

					<div class="overflow-x-auto pb-2">
						<div
							class="relative min-w-[920px] min-h-[680px] overflow-hidden border-2 border-emerald-900/70 bg-cover bg-center bg-no-repeat"
							style="background-image: url('/pitch-backdrop.jpg');"
						>
							<div
								class="absolute left-6 top-6 max-w-[280px] border border-white/25 bg-zinc-950/50 px-3 py-2"
							>
							<div class="font-bold text-lg truncate">{match.teams[0]?.name ?? 'Team 1'}</div>
							<div class="text-sm text-zinc-300">{teamStats(0).length} players</div>
						</div>
						<div
							class="absolute right-6 top-6 max-w-[280px] border border-white/25 bg-zinc-950/50 px-3 py-2 text-right"
						>
							<div class="font-bold text-lg truncate">{match.teams[1]?.name ?? 'Team 2'}</div>
							<div class="text-sm text-zinc-300">{teamStats(1).length} players</div>
						</div>

						{#each [0, 1] as teamIndex}
							{#each positionedStats(teamIndex) as placed (placed.stat._id)}
								{@const stat = placed.stat}
								{#if stat.player}
									<div
										class="absolute -translate-x-1/2 -translate-y-1/2"
										style="left: {placed.x}%; top: {placed.y}%;"
									>
										{#if hasGoalContributions(stat)}
											<div
												class="absolute left-0 right-0 top-0 z-10 flex -translate-y-[calc(100%+0.25rem)] items-center justify-between"
												aria-label={`${stat.goals} goals, ${stat.assists} assists`}
											>
												<div class="flex -space-x-2.5">
													{#each statIcons(stat.assists) as _}
														<div
															class="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-950/20 bg-zinc-50 text-zinc-950 shadow-md"
															title="Assist"
														>
															<FootballBootIcon />
														</div>
													{/each}
													{#if hasExtraStatIcons(stat.assists)}
														<div
															class="flex h-6 min-w-7 items-center justify-center rounded-full border border-zinc-950/20 bg-zinc-50 px-1 text-[10px] font-bold text-zinc-950 shadow-md"
															title={`${stat.assists} assists`}
														>
															+{extraStatIconCount(stat.assists)}
														</div>
													{/if}
												</div>
												<div class="flex -space-x-2.5">
													{#each statIcons(stat.goals) as _}
														<div
															class="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-950/20 bg-zinc-50 text-zinc-950 shadow-md"
															title="Goal"
														>
															<FootballIcon />
														</div>
													{/each}
													{#if hasExtraStatIcons(stat.goals)}
														<div
															class="flex h-6 min-w-7 items-center justify-center rounded-full border border-zinc-950/20 bg-zinc-50 px-1 text-[10px] font-bold text-zinc-950 shadow-md"
															title={`${stat.goals} goals`}
														>
															+{extraStatIconCount(stat.goals)}
														</div>
													{/if}
												</div>
											</div>
										{/if}
											<div
												class="w-20 overflow-hidden rounded-md border-2 border-black/20 bg-gradient-to-bl {cardColour(
													stat.rating
												)} text-zinc-950 shadow-lg"
											>
											<div class="flex items-start justify-between px-1.5 pt-1.5">
												<div class="font-bold text-lg leading-none">{stat.rating}</div>
												<div class="text-[10px] font-bold uppercase">{stat.position}</div>
											</div>
											{#if cardMode === 'simple'}
												<img
													src={`/players/${stat.player.nameId}.png`}
													alt={stat.player.name}
													class="w-11 h-11 mx-auto object-contain drop-shadow"
												/>
												<div class="px-1.5 pb-1.5 text-center">
													<div class="pt-1 text-[11px] font-bold uppercase truncate">
														{stat.player.name}
													</div>
													</div>
												{:else}
													<div class="px-1 py-1.5">
														<div class="text-center text-[10px] font-bold uppercase truncate mb-1">
															{stat.player.name}
														</div>
														<div class="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px] leading-none tabular-nums">
															{#each detailRows(stat) as [label, value]}
																<div class="grid min-w-0 grid-cols-[1fr_auto] items-center gap-0.5">
																	<span class="min-w-0 text-right">{value}</span>
																	<span class="font-bold">{label}</span>
																</div>
															{/each}
														</div>
												</div>
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						{/each}
					</div>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{#each [0, 1] as teamIndex}
						{@const team = match.teams[teamIndex]}
						<div class="flex flex-col gap-2 min-w-0">
							<div class="flex items-center justify-between">
								<div class="font-bold text-xl">{team?.name ?? `Team ${teamIndex + 1}`}</div>
								<div class="text-zinc-300">{teamStats(teamIndex).length} players</div>
							</div>
							<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
								{#each teamStats(teamIndex) as stat (stat._id)}
									{#if stat.player}
										<div class="bg-zinc-950/60 border border-zinc-700 p-2">
											<div class="font-bold truncate">{stat.player.name}</div>
											<div class="text-sm text-zinc-300">
												{stat.position} · {stat.goals}G {stat.assists}A
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4 flex flex-col gap-4">
					<div>
						<div class="text-xl font-bold">Timeline</div>
					</div>

					{#if match.events.length === 0}
						<div class="text-zinc-300 normal-case py-8 text-center">No events recorded yet.</div>
					{:else}
							<div class="relative py-1">
								<div class="absolute left-1/2 top-1 bottom-1 w-px -translate-x-1/2 bg-zinc-600/80"></div>
								{#each match.events as event, eventIndex (event._id)}
									{@const eventScore = scoreAtEvent(eventIndex)}
									<div class="relative grid grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] gap-2 py-1.5">
									<div
										class="row-start-1 w-full border p-2 {eventTone(
											event
										)} {eventCardPlacement(event)}"
											>
												<div class="flex items-center gap-1.5 {eventContentJustify(event)}">
													<span class="text-sm font-bold uppercase">{eventLabel(event)}</span>
													<span class="text-base font-bold">{event.minute}'</span>
													<span class="text-xs font-bold text-zinc-100">{eventScoreText(eventScore)}</span>
												</div>
											{#if event.type === 'goal'}
												<div
													class="flex items-center gap-2 text-xs text-zinc-200 normal-case {eventContentJustify(
														event
												)}"
											>
												<span class="inline-flex items-center gap-1 leading-none">
													<FootballIcon class="h-3.5 w-3.5 shrink-0" />
													{playerName(event.player)}
												</span>
												{#if event.assistPlayer}
													<span class="inline-flex items-center gap-1 leading-none">
														<FootballBootIcon class="h-3.5 w-3.5 shrink-0" />
														{event.assistPlayer.name}
													</span>
												{/if}
												</div>
											{:else if eventSummary(event)}
												<div class="text-xs text-zinc-200 normal-case truncate">
													{eventSummary(event)}
												</div>
											{/if}
										</div>

									{#if event.type !== 'break'}
										<div
											class="col-start-2 row-start-1 z-10 mx-auto flex h-9 w-9 self-center items-center justify-center rounded-full border-2 shadow-lg {eventMarkerTone(
												event
											)}"
											title={eventLabel(event)}
										>
											{#if event.type === 'goal'}
												<CircleDot size={17} strokeWidth={3} />
											{:else if event.type === 'yellow_card'}
												<RectangleVertical size={17} strokeWidth={3} />
											{:else if event.type === 'red_card'}
												<RectangleVertical size={17} strokeWidth={3} />
											{:else if event.type === 'penalty'}
												<Flag size={17} strokeWidth={3} />
											{:else if event.type === 'position_change'}
												<ArrowLeftRight size={17} strokeWidth={3} />
											{:else if event.type === 'note'}
												<StickyNote size={17} strokeWidth={3} />
											{:else}
												<BadgeAlert size={17} strokeWidth={3} />
											{/if}
										</div>
									{/if}
								</div>
							{/each}
					</div>
				{/if}
			</section>
		</div>
	{/if}
</div>
