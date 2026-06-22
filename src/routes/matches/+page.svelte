<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import type { FunctionReturnType } from 'convex/server';
	import { api } from '../../convex/_generated/api';
	import type { Id } from '../../convex/_generated/dataModel';
	import { Check, Clock, Pencil, Plus, Save, Trash2, UserPlus, X } from '@lucide/svelte';

	type Match = FunctionReturnType<typeof api.matches.getAll>[number];
	type TeamDraft = {
		id?: Id<'teams'>;
		name: string;
		score: number;
		captainId?: Id<'players'>;
		teamColour: string;
	};
	type StatMode = 'outfield' | 'keeper';
	type EventType =
		| 'goal'
		| 'yellow_card'
		| 'red_card'
		| 'penalty'
		| 'position_change'
		| 'break'
		| 'note';
	type StatDraft = {
		playerId: Id<'players'>;
		teamIndex: number;
		isCaptain: boolean;
		rating: number;
		position: string;
		mode: StatMode;
		one: number;
		two: number;
		three: number;
		four: number;
		five: number;
		six: number;
	};
	type EventDraft = {
		type: EventType;
		minute: number;
		teamIndex: number;
		playerId?: Id<'players'>;
		assistPlayerId?: Id<'players'>;
		note: string;
	};
	type MatchDraft = {
		matchId?: Id<'matches'>;
		order: number;
		hasAuction: boolean;
		participants: Id<'players'>[];
		teams: [TeamDraft, TeamDraft];
		stats: StatDraft[];
		events: EventDraft[];
	};

	const client = useConvexClient();
	const matches = $derived(useQuery(api.matches.getAll, {}));
	const players = $derived(useQuery(api.players.getAll, {}));
	const playerList = $derived(players.data ?? []);
	const matchList = $derived(matches.data ?? []);

	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let candidatePlayerId = $state<Id<'players'> | ''>('');
	let draft = $state<MatchDraft>(createEmptyDraft());
	let eventDraft = $state<EventDraft>(createEmptyEvent());
	let showEditor = $state(false);

	const outfieldLabels = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
	const keeperLabels = ['DIV', 'HAN', 'KIC', 'REF', 'SPE', 'POS'];

	function createEmptyDraft(): MatchDraft {
		return {
			order: 1,
			hasAuction: false,
			participants: [],
			teams: [
				{ name: 'Team 1', score: 0, teamColour: '#5e003f' },
				{ name: 'Team 2', score: 0, teamColour: '#1e2c3a' }
			],
			stats: [],
			events: []
		};
	}

	function createEmptyEvent(): EventDraft {
		return {
			type: 'goal',
			minute: 1,
			teamIndex: 0,
			playerId: undefined,
			assistPlayerId: undefined,
			note: ''
		};
	}

	function getPlayer(playerId?: Id<'players'>) {
		return playerList.find((player) => player._id === playerId);
	}

	function playerName(playerId?: Id<'players'>) {
		return getPlayer(playerId)?.name ?? 'Unknown player';
	}

	function sortPlayerIds(playerIds: Id<'players'>[]) {
		return playerIds
			.slice()
			.sort((a, b) => playerName(a).localeCompare(playerName(b), undefined, { sensitivity: 'base' }));
	}

	function sortedStats() {
		return draft.stats.slice().sort((a, b) => {
			if (a.teamIndex !== b.teamIndex) return a.teamIndex - b.teamIndex;
			return playerName(a.playerId).localeCompare(playerName(b.playerId), undefined, {
				sensitivity: 'base'
			});
		});
	}

	function playerTeamIndex(playerId?: Id<'players'>) {
		return draft.stats.find((stat) => stat.playerId === playerId)?.teamIndex ?? 0;
	}

	function statLabels(mode: StatMode) {
		return mode === 'keeper' ? keeperLabels : outfieldLabels;
	}

	function readBreakdown(breakdown: string) {
		try {
			return JSON.parse(breakdown) as Record<string, number>;
		} catch {
			return {};
		}
	}

	function breakdownMode(breakdown: Record<string, number>): StatMode {
		return breakdown.diving !== undefined || breakdown.handling !== undefined ? 'keeper' : 'outfield';
	}

	function makeBreakdown(stat: StatDraft) {
		if (stat.mode === 'keeper') {
			return JSON.stringify({
				diving: stat.one,
				handling: stat.two,
				kicking: stat.three,
				reflexes: stat.four,
				speed: stat.five,
				positioning: stat.six
			});
		}

		return JSON.stringify({
			pace: stat.one,
			shooting: stat.two,
			passing: stat.three,
			dribbling: stat.four,
			defending: stat.five,
			physical: stat.six
		});
	}

	function statValue(stat: StatDraft, valueIndex: number) {
		return [stat.one, stat.two, stat.three, stat.four, stat.five, stat.six][valueIndex] ?? 0;
	}

	function createStatDraft(playerId: Id<'players'>, teamIndex = 0): StatDraft {
		return {
			playerId,
			teamIndex,
			isCaptain: false,
			rating: 50,
			position: 'ST',
			mode: 'outfield',
			one: 50,
			two: 50,
			three: 50,
			four: 50,
			five: 50,
			six: 50
		};
	}

	function startNew() {
		const nextOrder = (matchList[0]?.order ?? 0) + 1;
		draft = { ...createEmptyDraft(), order: nextOrder };
		eventDraft = createEmptyEvent();
		candidatePlayerId = '';
		saveState = 'idle';
		showEditor = true;
	}

	function editMatch(match: Match) {
		const fallbackParticipants = [
			...new Set([
				...match.participants,
				...match.teams.flatMap((team) => team.playerIds),
				...match.stats.map((stat) => stat.playerId),
				...match.events.flatMap((event) => [event.playerId, event.assistPlayerId]).filter(Boolean)
			])
		] as Id<'players'>[];

		const statsByPlayer = new Map(match.stats.map((stat) => [stat.playerId, stat]));
		const stats = fallbackParticipants.map((playerId) => {
			const existing = statsByPlayer.get(playerId);
			const teamIndex = Math.max(
				0,
				match.teams.findIndex((team) => team.playerIds.includes(playerId))
			);

			if (!existing) return createStatDraft(playerId, teamIndex);

			const breakdown = readBreakdown(existing.breakdown);
			const mode = breakdownMode(breakdown);

			return {
				playerId,
				teamIndex,
				isCaptain: existing.isCaptain,
				rating: existing.rating,
				position: existing.position,
				mode,
				one: mode === 'keeper' ? (breakdown.diving ?? 50) : (breakdown.pace ?? 50),
				two: mode === 'keeper' ? (breakdown.handling ?? 50) : (breakdown.shooting ?? 50),
				three: mode === 'keeper' ? (breakdown.kicking ?? 50) : (breakdown.passing ?? 50),
				four: mode === 'keeper' ? (breakdown.reflexes ?? 50) : (breakdown.dribbling ?? 50),
				five: mode === 'keeper' ? (breakdown.speed ?? 50) : (breakdown.defending ?? 50),
				six: mode === 'keeper' ? (breakdown.positioning ?? 50) : (breakdown.physical ?? 50)
			};
		});

		draft = {
			matchId: match._id,
			order: match.order,
			hasAuction: match.hasAuction,
			participants: fallbackParticipants,
			teams: [
				{
					id: match.teams[0]?._id,
					name: match.teams[0]?.name ?? 'Team 1',
					score: match.teams[0]?.score ?? 0,
					captainId: match.teams[0]?.captainId,
					teamColour: match.teams[0]?.teamColour ?? '#5e003f'
				},
				{
					id: match.teams[1]?._id,
					name: match.teams[1]?.name ?? 'Team 2',
					score: match.teams[1]?.score ?? 0,
					captainId: match.teams[1]?.captainId,
					teamColour: match.teams[1]?.teamColour ?? '#1e2c3a'
				}
			],
			stats,
			events: match.events.map((event) => ({
				type: event.type as EventType,
				minute: event.minute,
				teamIndex: Math.max(
					0,
					match.teams.findIndex((team) => team._id === event.teamId)
				),
				playerId: event.playerId,
				assistPlayerId: event.assistPlayerId,
				note: event.note ?? ''
			}))
		};
		eventDraft = createEmptyEvent();
		candidatePlayerId = '';
		saveState = 'idle';
		showEditor = true;
	}

	function closeEditor() {
		showEditor = false;
		saveState = 'idle';
	}

	function addParticipant() {
		if (!candidatePlayerId || draft.participants.includes(candidatePlayerId)) return;
		draft.participants = [...draft.participants, candidatePlayerId];
		draft.stats = [...draft.stats, createStatDraft(candidatePlayerId)];
		candidatePlayerId = '';
	}

	function removeParticipant(playerId: Id<'players'>) {
		draft.participants = draft.participants.filter((id) => id !== playerId);
		draft.stats = draft.stats.filter((stat) => stat.playerId !== playerId);
		draft.events = draft.events.filter(
			(event) => event.playerId !== playerId && event.assistPlayerId !== playerId
		);
	}

	function setCaptain(teamIndex: number, playerId: Id<'players'> | '') {
		draft.teams[teamIndex].captainId = playerId || undefined;
		draft.stats = draft.stats.map((stat) => ({
			...stat,
			isCaptain: stat.playerId === playerId || draft.teams.some((team) => team.captainId === stat.playerId)
		}));
	}

	function availablePlayers() {
		return playerList
			.filter((player) => !draft.participants.includes(player._id))
			.slice()
			.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
	}

	function teamPlayerIds(teamIndex: number) {
		const ids = draft.stats
			.filter((stat) => stat.teamIndex === teamIndex)
			.map((stat) => stat.playerId);
		const captainId = draft.teams[teamIndex].captainId;
		return captainId ? [...new Set([captainId, ...ids])] : ids;
	}

	function addEvent() {
		if (!['note', 'break'].includes(eventDraft.type) && !eventDraft.playerId) return;
		draft.events = [
			...draft.events,
			{
				...eventDraft,
				teamIndex: eventDraft.playerId ? playerTeamIndex(eventDraft.playerId) : eventDraft.teamIndex,
				assistPlayerId: eventDraft.type === 'goal' ? eventDraft.assistPlayerId : undefined
			}
		].sort((a, b) => a.minute - b.minute);
		eventDraft = createEmptyEvent();
	}

	function removeEvent(index: number) {
		draft.events = draft.events.filter((_, eventIndex) => eventIndex !== index);
	}

	function eventLabel(event: EventDraft) {
		if (event.type === 'goal') return 'Goal';
		if (event.type === 'yellow_card') return 'Yellow';
		if (event.type === 'red_card') return 'Red';
		if (event.type === 'penalty') return 'Penalty';
		if (event.type === 'position_change') return 'Position';
		if (event.type === 'break') return 'Break';
		return 'Note';
	}

	function eventTone(event: EventDraft) {
		if (event.type === 'goal') return 'text-green-300';
		if (event.type === 'yellow_card') return 'text-yellow-400';
		if (event.type === 'red_card') return 'text-red-300';
		if (event.type === 'position_change') return 'text-blue-300';
		if (event.type === 'break') return 'text-highlight';
		return 'text-zinc-300';
	}

	async function saveMatch() {
		const [teamOne, teamTwo] = draft.teams;
		if (!teamOne.captainId || !teamTwo.captainId) {
			saveState = 'error';
			return;
		}

		saveState = 'saving';
		try {
			const matchId = await client.mutation(api.matches.save, {
				matchId: draft.matchId,
				order: Number(draft.order),
				hasAuction: draft.hasAuction,
				participants: draft.participants,
				teams: draft.teams.map((team, index) => ({
					id: team.id,
					name: team.name,
					score: Number(team.score),
					captainId: team.captainId as Id<'players'>,
					playerIds: teamPlayerIds(index),
					teamColour: team.teamColour || undefined
				})),
				stats: draft.stats.map((stat) => ({
					playerId: stat.playerId,
					isCaptain: draft.teams.some((team) => team.captainId === stat.playerId),
					rating: Number(stat.rating),
					position: stat.position,
					breakdown: makeBreakdown(stat)
				})),
				events: draft.events.map((event) => ({
					type: event.type,
					minute: Number(event.minute),
					teamIndex: event.teamIndex,
					playerId: event.playerId,
					assistPlayerId: event.assistPlayerId,
					note: event.note || undefined
				}))
			});

			draft.matchId = matchId;
			saveState = 'saved';
			setTimeout(() => {
				if (saveState === 'saved') saveState = 'idle';
			}, 1500);
		} catch (error) {
			console.error(error);
			saveState = 'error';
		}
	}
</script>

<div class="w-full text-white flex flex-col gap-4">
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-3">
		<div>
			<div class="text-4xl font-bold">Matches</div>
			<div class="text-zinc-300 normal-case">
				Pick a Burncastle to view, edit an existing record, or create a new match.
			</div>
		</div>
		<button
			class="flex items-center gap-2 bg-zinc-900 border-2 border-zinc-700 hover:bg-zinc-800 px-4 py-2 uppercase cursor-pointer w-fit"
			onclick={startNew}
		>
			<Plus size={18} />
			New Match
		</button>
	</div>

	<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4 flex flex-col gap-3">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
			<div>
				<div class="text-xl font-bold">Burncastle Archive</div>
				<div class="text-sm text-zinc-400 normal-case">Click a match to view it. Use the pencil to edit.</div>
			</div>
			<div class="text-sm text-zinc-400">{matchList.length} matches</div>
		</div>
		<div>
			{#if matches.error}
				<div class="border-2 border-red-500/50 bg-red-950/40 p-3 text-red-100 normal-case">
					<div class="font-bold uppercase">Could not load matches</div>
					<div class="mt-1 text-sm">{matches.error.message}</div>
				</div>
			{:else if matches.isLoading}
				<div class="text-zinc-300">Loading matches...</div>
			{:else if matchList.length === 0}
				<div class="text-zinc-300 normal-case">
					No matches came back from Convex. If the table has rows, make sure the latest Convex
					functions are running for this deployment.
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
					{#each matchList as match (match._id)}
						<div
							class="border-2 border-zinc-700 bg-zinc-950/50 hover:bg-zinc-900 transition-colors p-3"
						>
							<div class="flex justify-between items-center gap-3">
								<a href={`/matches/${match._id}`} class="font-bold text-2xl hover:text-highlight">
									Burncastle {match.order}
								</a>
								<button
									class="text-highlight hover:text-white cursor-pointer"
									aria-label="Edit match"
									onclick={() => editMatch(match)}
								>
									<Pencil size={18} />
								</button>
							</div>
							<a href={`/matches/${match._id}`} class="flex items-center justify-between mt-2 text-lg gap-3">
								<div class="truncate">{match.teams[0]?.name ?? 'Team 1'}</div>
								<div class="font-bold whitespace-nowrap">
									{match.teams[0]?.score ?? 0} - {match.teams[1]?.score ?? 0}
								</div>
								<div class="truncate text-right">{match.teams[1]?.name ?? 'Team 2'}</div>
							</a>
							<div class="text-sm text-zinc-400 mt-2">
								{match.events.length} events, {match.stats.length} player cards
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	{#if showEditor}
		<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4 flex flex-col gap-5">
			<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
				<div>
					<div class="text-2xl font-bold">
						{#if draft.matchId}Edit Burncastle {draft.order}{:else}Create Match{/if}
					</div>
					<div class="text-zinc-300 normal-case">
						Goals and assists come from timeline events. Player cards hold ratings and positions.
					</div>
				</div>
				<div class="flex gap-2">
					<button
						class="flex items-center gap-2 bg-zinc-900 border-2 border-zinc-700 hover:bg-zinc-800 px-4 py-2 uppercase cursor-pointer"
						onclick={closeEditor}
					>
						<X size={18} />
						Close
					</button>
					<button
						class="flex items-center gap-2 bg-burnley border-2 border-highlight/40 hover:bg-[#7a1055] px-4 py-2 uppercase cursor-pointer disabled:opacity-50"
						onclick={saveMatch}
						disabled={saveState === 'saving' || draft.participants.length === 0}
					>
						{#if saveState === 'saved'}
							<Check size={18} />
							Saved
						{:else}
							<Save size={18} />
							{saveState === 'saving' ? 'Saving...' : 'Save Match'}
						{/if}
					</button>
				</div>
			</div>

			{#if saveState === 'error'}
				<div class="border-2 border-red-500/50 bg-red-950/40 p-3 text-red-100 normal-case">
					Check both captains are selected and try again.
				</div>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-[160px_180px_1fr] gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-sm text-zinc-300">Burncastle Number</span>
					<input
						type="number"
						min="1"
						bind:value={draft.order}
						class="bg-zinc-800 border-zinc-600 text-white"
					/>
				</label>
				<label class="flex items-center gap-3 mt-6">
					<input type="checkbox" bind:checked={draft.hasAuction} class="bg-zinc-800 border-zinc-600" />
					<span>Has Auction</span>
				</label>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{#each draft.teams as team, index (index)}
					<div class="border-2 border-zinc-700 bg-zinc-950/40 p-4 flex flex-col gap-3">
						<div class="font-bold text-xl">Team {index + 1}</div>
						<div class="grid grid-cols-1 md:grid-cols-[1fr_100px_96px] gap-3">
							<label class="flex flex-col gap-1">
								<span class="text-sm text-zinc-300">Name</span>
								<input bind:value={team.name} class="bg-zinc-800 border-zinc-600 text-white" />
							</label>
							<label class="flex flex-col gap-1">
								<span class="text-sm text-zinc-300">Score</span>
								<input
									type="number"
									min="0"
									bind:value={team.score}
									class="bg-zinc-800 border-zinc-600 text-white"
								/>
							</label>
							<label class="flex flex-col gap-1">
								<span class="text-sm text-zinc-300">Colour</span>
								<input
									type="color"
									bind:value={team.teamColour}
									class="h-10 bg-zinc-800 border-zinc-600 text-white"
								/>
							</label>
						</div>
						<label class="flex flex-col gap-1">
							<span class="text-sm text-zinc-300">Captain</span>
							<select
								value={team.captainId ?? ''}
								onchange={(event) =>
									setCaptain(index, event.currentTarget.value as Id<'players'> | '')}
								class="bg-zinc-800 border-zinc-600 text-white"
							>
								<option value="">Select captain</option>
								{#each sortPlayerIds(draft.participants) as playerId (playerId)}
									<option value={playerId}>{playerName(playerId)}</option>
								{/each}
							</select>
						</label>
					</div>
				{/each}
			</div>

			<div class="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_480px] gap-4">
				<div class="border-2 border-zinc-700 bg-zinc-950/40 p-4 flex flex-col gap-3">
					<div class="flex flex-col md:flex-row md:items-end justify-between gap-3">
						<div>
							<div class="font-bold text-xl">Players And Cards</div>
							<div class="text-zinc-300 normal-case">
								Add players, choose their team, and enter rating/card attributes.
							</div>
						</div>
						<div class="flex gap-2">
							<select bind:value={candidatePlayerId} class="bg-zinc-800 border-zinc-600 text-white">
								<option value="">Add player</option>
								{#each availablePlayers() as player (player._id)}
									<option value={player._id}>{player.name}</option>
								{/each}
							</select>
							<button
								class="flex items-center gap-2 bg-zinc-900 border-2 border-zinc-700 hover:bg-zinc-800 px-3 py-2 uppercase cursor-pointer"
								onclick={addParticipant}
							>
								<UserPlus size={18} />
								Add
							</button>
						</div>
					</div>

					{#if draft.stats.length === 0}
						<div class="text-zinc-300 normal-case py-8 text-center">
							Add players before building the timeline.
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full min-w-[900px] text-sm">
								<thead>
									<tr class="text-left text-zinc-300 border-b border-zinc-700">
										<th class="py-2 pr-2">Player</th>
										<th class="py-2 px-2">Team</th>
										<th class="py-2 px-2">Pos</th>
										<th class="py-2 px-2">Rating</th>
										<th class="py-2 px-2">Type</th>
										{#each outfieldLabels as label}
											<th class="py-2 px-2">{label}</th>
										{/each}
										<th class="py-2 pl-2"></th>
									</tr>
								</thead>
								<tbody>
									{#each sortedStats() as stat (stat.playerId)}
										{@const labels = statLabels(stat.mode)}
										<tr class="border-b border-zinc-800">
											<td class="py-2 pr-2 font-medium">{playerName(stat.playerId)}</td>
											<td class="py-2 px-2">
												<select bind:value={stat.teamIndex} class="bg-zinc-800 border-zinc-600 text-white">
													<option value={0}>{draft.teams[0].name}</option>
													<option value={1}>{draft.teams[1].name}</option>
												</select>
											</td>
											<td class="py-2 px-2">
												<input
													bind:value={stat.position}
													class="w-16 bg-zinc-800 border-zinc-600 text-white"
												/>
											</td>
											<td class="py-2 px-2">
												<input
													type="number"
													min="0"
													max="99"
													bind:value={stat.rating}
													class="w-20 bg-zinc-800 border-zinc-600 text-white"
												/>
											</td>
											<td class="py-2 px-2">
												<select bind:value={stat.mode} class="bg-zinc-800 border-zinc-600 text-white">
													<option value="outfield">Outfield</option>
													<option value="keeper">Keeper</option>
												</select>
											</td>
											{#each [0, 1, 2, 3, 4, 5] as valueIndex}
												<td class="py-2 px-2">
													<label class="flex flex-col gap-1">
														<span class="text-[11px] text-zinc-400">{labels[valueIndex]}</span>
														<input
															type="number"
															min="0"
															max="99"
															value={statValue(stat, valueIndex)}
															oninput={(event) => {
																const next = Number(event.currentTarget.value);
																if (valueIndex === 0) stat.one = next;
																if (valueIndex === 1) stat.two = next;
																if (valueIndex === 2) stat.three = next;
																if (valueIndex === 3) stat.four = next;
																if (valueIndex === 4) stat.five = next;
																if (valueIndex === 5) stat.six = next;
															}}
															class="w-16 bg-zinc-800 border-zinc-600 text-white"
														/>
													</label>
												</td>
											{/each}
											<td class="py-2 pl-2">
												<button
													class="text-red-300 hover:text-red-100 cursor-pointer"
													onclick={() => removeParticipant(stat.playerId)}
												>
													Remove
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>

				<div class="border-2 border-zinc-700 bg-zinc-950/40 p-4 flex flex-col gap-4">
					<div>
						<div class="font-bold text-xl">Timeline</div>
						<div class="text-zinc-300 normal-case">
							Events create the story of the match and drive goals and assists.
						</div>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<label class="flex flex-col gap-1">
							<span class="text-sm text-zinc-300">Minute</span>
							<input
								type="number"
								min="0"
								bind:value={eventDraft.minute}
								class="bg-zinc-800 border-zinc-600 text-white"
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span class="text-sm text-zinc-300">Event</span>
							<select bind:value={eventDraft.type} class="bg-zinc-800 border-zinc-600 text-white">
								<option value="goal">Goal</option>
								<option value="yellow_card">Yellow Card</option>
								<option value="red_card">Red Card</option>
								<option value="penalty">Penalty</option>
								<option value="position_change">Position Change</option>
								<option value="break">Break In Play</option>
								<option value="note">Note</option>
							</select>
						</label>
						{#if eventDraft.type !== 'break'}
							<label class="flex flex-col gap-1 col-span-2">
								<span class="text-sm text-zinc-300">Player</span>
								<select bind:value={eventDraft.playerId} class="bg-zinc-800 border-zinc-600 text-white">
									<option value={undefined}>Select player</option>
									{#each sortedStats() as stat (stat.playerId)}
										<option value={stat.playerId}>{playerName(stat.playerId)}</option>
									{/each}
								</select>
							</label>
						{/if}
						{#if eventDraft.type === 'goal'}
							<label class="flex flex-col gap-1 col-span-2">
								<span class="text-sm text-zinc-300">Assist</span>
								<select
									bind:value={eventDraft.assistPlayerId}
									class="bg-zinc-800 border-zinc-600 text-white"
								>
									<option value={undefined}>No assist</option>
									{#each sortedStats().filter((stat) => stat.playerId !== eventDraft.playerId) as stat (stat.playerId)}
										<option value={stat.playerId}>{playerName(stat.playerId)}</option>
									{/each}
								</select>
							</label>
						{/if}
						<label class="flex flex-col gap-1 col-span-2">
							<span class="text-sm text-zinc-300">Note</span>
							<input
								bind:value={eventDraft.note}
								class="bg-zinc-800 border-zinc-600 text-white"
								placeholder={eventDraft.type === 'position_change' ? 'New position, e.g. ST to CM' : 'Optional'}
							/>
						</label>
					</div>

					<button
						class="flex justify-center items-center gap-2 bg-zinc-900 border-2 border-zinc-700 hover:bg-zinc-800 px-3 py-2 uppercase cursor-pointer disabled:opacity-50"
						onclick={addEvent}
						disabled={draft.stats.length === 0}
					>
						<Clock size={18} />
						Add Event
					</button>

					<div class="flex flex-col gap-2">
						{#if draft.events.length === 0}
							<div class="text-zinc-300 normal-case py-6 text-center">
								Add goals, cards, penalties, or notes to build the timeline.
							</div>
						{:else}
							{#each draft.events as event, index (index)}
								<div class="grid grid-cols-[56px_1fr_32px] gap-3 items-start border border-zinc-700 bg-zinc-900/50 p-3">
									<div class="font-bold text-highlight">{event.minute}'</div>
									<div>
										<div class="font-bold {eventTone(event)}">
											{eventLabel(event)}
											{#if event.playerId}
												<span class="text-white">- {playerName(event.playerId)}</span>
											{/if}
										</div>
										{#if event.type === 'goal' && event.assistPlayerId}
											<div class="text-sm text-zinc-300 normal-case">
												Assist: {playerName(event.assistPlayerId)}
											</div>
										{/if}
										{#if event.note}
											<div class="text-sm text-zinc-400 normal-case">{event.note}</div>
										{/if}
										<div class="text-xs text-zinc-500 mt-1">{draft.teams[event.teamIndex]?.name}</div>
									</div>
									<button
										class="text-red-300 hover:text-red-100 cursor-pointer"
										aria-label="Remove event"
										onclick={() => removeEvent(index)}
									>
										<Trash2 size={16} />
									</button>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</section>
	{/if}
</div>
