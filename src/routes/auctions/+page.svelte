<script lang="ts">
	import { goto } from '$app/navigation';
	import MatchRow from '$lib/components/MatchRow.svelte';
	import { api } from '../../convex/_generated/api';
	import type { Id } from '../../convex/_generated/dataModel';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { Check, Plus, Users, X } from '@lucide/svelte';

	const client = useConvexClient();
	let auctions = $derived(useQuery(api.auctions.getAll, {}));
	let players = $derived(useQuery(api.players.getAll, {}));
	let playerList = $derived(
		(players.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
	);
	let nextOrder = $derived(
		(auctions.data ?? []).reduce((max, auction) => Math.max(max, auction.order), 0) + 1
	);

	let showSetup = $state(false);
	let order = $state<number | undefined>();
	let captainOneId = $state<Id<'players'> | ''>('');
	let captainTwoId = $state<Id<'players'> | ''>('');
	let teamOneName = $state('Team 1');
	let teamTwoName = $state('Team 2');
	let teamOneColour = $state('#5e003f');
	let teamTwoColour = $state('#1e2c3a');
	let live = $state(true);
	let selectedParticipantIds = $state<Id<'players'>[]>([]);
	let selectedAuctioneerIds = $state<Id<'players'>[]>([]);
	let createError = $state('');
	let isCreating = $state(false);
	let initialisedPlayers = $state(false);

	$effect(() => {
		if (!initialisedPlayers && playerList.length) {
			selectedParticipantIds = playerList.map((player) => player._id);
			captainOneId = playerList[0]?._id ?? '';
			captainTwoId = playerList[1]?._id ?? '';
			order = nextOrder;
			initialisedPlayers = true;
		}
	});

	$effect(() => {
		if (order === undefined && nextOrder > 0) {
			order = nextOrder;
		}
	});

	function toggleId(list: Id<'players'>[], id: Id<'players'>) {
		return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
	}

	function toggleParticipant(playerId: Id<'players'>) {
		selectedParticipantIds = toggleId(selectedParticipantIds, playerId);
	}

	function toggleAuctioneer(playerId: Id<'players'>) {
		selectedAuctioneerIds = toggleId(selectedAuctioneerIds, playerId);
	}

	function selectAllParticipants() {
		selectedParticipantIds = playerList.map((player) => player._id);
	}

	function clearParticipants() {
		selectedParticipantIds = captainOneId && captainTwoId ? [captainOneId, captainTwoId] : [];
	}

	async function startAuction() {
		createError = '';
		if (!captainOneId || !captainTwoId) {
			createError = 'Pick two captains before starting the draft.';
			return;
		}
		if (captainOneId === captainTwoId) {
			createError = 'Captains must be different players.';
			return;
		}

		isCreating = true;
		try {
			const matchId = await client.mutation(api.auctions.startDraft, {
				order,
				participants: selectedParticipantIds,
				captainOneId,
				captainTwoId,
				auctioneerIds: selectedAuctioneerIds,
				teamOneName,
				teamTwoName,
				teamOneColour,
				teamTwoColour,
				live
			});
			await goto(`/auctions/${matchId}`);
		} catch (error) {
			createError = error instanceof Error ? error.message : 'Could not start auction.';
		} finally {
			isCreating = false;
		}
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-4 text-white">
	<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4">
		<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div class="min-w-0">
				<div class="text-3xl font-bold">Auctions</div>
				<div class="max-w-prose text-white/75 normal-case">
					Start the next Burncastle draft or open an existing auction.
				</div>
			</div>
			<button
				class="flex min-h-11 w-full items-center justify-center gap-2 border-2 border-highlight bg-highlight px-4 py-2 font-bold uppercase text-zinc-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:border-white/30 disabled:bg-[#3a2433] disabled:text-white sm:w-fit"
				disabled={!playerList.length}
				onclick={() => (showSetup = !showSetup)}
			>
				{#if showSetup}
					<X size={18} />
					Close
				{:else}
					<Plus size={18} />
					New Auction
				{/if}
			</button>
		</div>
	</section>

	{#if showSetup}
		<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4">
			<div class="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
				<div class="flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-3">
						<label class="flex flex-col gap-1">
							<span class="text-sm text-zinc-300">Burncastle</span>
							<input
								type="number"
								min="1"
								bind:value={order}
								class="border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span class="text-sm text-zinc-300">Status</span>
							<span
								class="flex h-[42px] items-center gap-2 border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
							>
								<input type="checkbox" bind:checked={live} />
								<span>{live ? 'Open' : 'Closed'}</span>
							</span>
						</label>
					</div>

					<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
						<div class="border border-zinc-700 p-3">
							<div class="mb-2 font-bold uppercase">Team 1</div>
							<div class="flex flex-col gap-2">
								<input
									bind:value={teamOneName}
									class="border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
								/>
								<select
									bind:value={captainOneId}
									class="border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
								>
									{#each playerList as player (player._id)}
										<option value={player._id}>{player.name}</option>
									{/each}
								</select>
								<input
									type="color"
									bind:value={teamOneColour}
									class="h-10 w-full border border-zinc-700 bg-zinc-950"
								/>
							</div>
						</div>

						<div class="border border-zinc-700 p-3">
							<div class="mb-2 font-bold uppercase">Team 2</div>
							<div class="flex flex-col gap-2">
								<input
									bind:value={teamTwoName}
									class="border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
								/>
								<select
									bind:value={captainTwoId}
									class="border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none"
								>
									{#each playerList as player (player._id)}
										<option value={player._id}>{player.name}</option>
									{/each}
								</select>
								<input
									type="color"
									bind:value={teamTwoColour}
									class="h-10 w-full border border-zinc-700 bg-zinc-950"
								/>
							</div>
						</div>
					</div>

					<div class="border border-zinc-700 p-3">
						<div class="mb-2 flex items-center gap-2 font-bold uppercase">
							<Users size={16} />
							Auctioneers
						</div>
						<div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-1">
							{#each playerList as player (player._id)}
								<label class="flex cursor-pointer items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={selectedAuctioneerIds.includes(player._id)}
										onchange={() => toggleAuctioneer(player._id)}
									/>
									<span>{player.name}</span>
								</label>
							{/each}
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-4">
					<div class="border border-zinc-700 p-3">
						<div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
							<div>
								<div class="font-bold uppercase">Draft Pool</div>
								<div class="text-sm text-white/75 normal-case">
									{selectedParticipantIds.length} of {playerList.length} players selected
								</div>
							</div>
							<div class="grid grid-cols-2 gap-2 sm:flex">
								<button
									class="min-h-11 border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm uppercase hover:bg-zinc-800"
									onclick={selectAllParticipants}
								>
									All
								</button>
								<button
									class="min-h-11 border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm uppercase hover:bg-zinc-800"
									onclick={clearParticipants}
								>
									Captains Only
								</button>
							</div>
						</div>

						<div
							class="grid max-h-[480px] grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3"
						>
							{#each playerList as player (player._id)}
								<label
									class="flex cursor-pointer items-center justify-between gap-3 border border-zinc-800 bg-zinc-950/60 p-2"
								>
									<div class="flex min-w-0 items-center gap-2">
										<img
											src={`/players/${player.nameId}.png`}
											alt={player.name}
											class="h-10 w-10"
										/>
										<div class="min-w-0">
											<div class="truncate font-bold">{player.name}</div>
											<div class="text-xs text-zinc-400">OVR {player.stats[0]?.rating ?? '-'}</div>
										</div>
									</div>
									<input
										type="checkbox"
										checked={selectedParticipantIds.includes(player._id)}
										onchange={() => toggleParticipant(player._id)}
									/>
								</label>
							{/each}
						</div>
					</div>

					{#if createError}
						<div class="border border-red-500/50 bg-red-950/60 p-3 text-red-100 normal-case">
							{createError}
						</div>
					{/if}

					<button
						class="flex min-h-12 items-center justify-center gap-2 border-2 border-highlight bg-highlight px-4 py-3 font-bold uppercase text-zinc-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:border-white/30 disabled:bg-[#3a2433] disabled:text-white"
						disabled={isCreating || !captainOneId || !captainTwoId}
						onclick={startAuction}
					>
						<Check size={18} />
						{isCreating ? 'Starting...' : 'Start Draft Auction'}
					</button>
				</div>
			</div>
		</section>
	{/if}

	{#if auctions.error}
		<div class="border border-red-500/50 bg-red-950/60 p-4 text-red-100">
			<div class="font-bold uppercase">Could not load auctions</div>
			<div class="normal-case">{auctions.error.message}</div>
		</div>
	{:else if auctions.data !== undefined && !auctions.isLoading}
		<div class="flex w-full flex-col gap-4">
			{#each auctions.data as auction (auction._id)}
				<a href="/auctions/{auction._id}">
					<MatchRow match={auction} />
				</a>
			{/each}
		</div>
	{:else}
		<div class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4 text-zinc-300">
			Loading auctions...
		</div>
	{/if}
</div>
