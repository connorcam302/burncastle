<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import FootballIcon from '$lib/components/icons/FootballIcon.svelte';
	import FootballBootIcon from '$lib/components/icons/FootballBootIcon.svelte';
	import { RectangleEllipsis } from '@lucide/svelte';
	import type { Id } from '../../../convex/_generated/dataModel';

	let { data } = $props();
	const client = useConvexClient();

	let matchId = data.matchId as Id<'matches'>;

	let auction = $derived(useQuery(api.auctions.get, { matchId }));
	let allPlayers = $derived(useQuery(api.players.getAll, {}));
	let match = $derived(auction.data);
	let playersList = $derived(allPlayers.data ?? []);
	let auctionState = $derived(match?.auction);
	let teamOne = $derived(match?.teams[0]);
	let teamTwo = $derived(match?.teams[1]);

	let showKeyPrompt = $state(false);
	let enteredKey = $state('');
	let keyError = $state('');

	const checkKey = () => {
		const player = playersList.find((p) => p._id === enteredKey);
		if (player) {
			localStorage.setItem('userId', player._id);
			showKeyPrompt = false;
			userId = player._id;
		} else {
			keyError = 'Invalid Key';
			setTimeout(() => (keyError = ''), 1500);
		}
	};

	let userId = $state(localStorage.getItem('userId') as Id<'players'> | null);

	const getPermissions = (userId: Id<'players'>) => {
		if (userId === teamOne?.captainId || userId === teamTwo?.captainId) {
			return 'captain';
		}
		if (auctionState?.auctioneers?.includes(userId)) {
			return 'auctioneer';
		}
	};

	let permissions = $derived(userId && getPermissions(userId));

	let winningBids = $derived(match?.bids.filter((b) => b.winningBid === true) ?? []);

	let bidsOnSelectedPlayer = $derived(
		auctionState?.displayedPlayerId &&
			useQuery(api.bids.getOnePlayer, { playerId: auctionState.displayedPlayerId, matchId })
	);
	let selectedPlayerBids = $derived(bidsOnSelectedPlayer?.data ?? []);
	let topBid = $derived(selectedPlayerBids[0]);

	let newBidAmountRaw = $state('0');
	let newBidAmount = $derived(parseInt(newBidAmountRaw, 10) || 0);

	const submitBid = () => {
		if (!userId || !auctionState?.displayedPlayerId || !match || !teamOne || !teamTwo) return;

		if (newBidAmount <= 0 || (topBid && topBid.amount >= newBidAmount)) {
			alert('Bid must be greater than 0 and greater than the current bid');
			return;
		}

		// check if the player has enough funds
		// team 1 scenario
		if (teamOne.captainId === userId) {
			if (newBidAmount + teamOneSpend > startingAmount) {
				alert('You do not have enough funds to bid this amount');
				return;
			}

			if (teamOne.playerIds.length === match.participants.length / 2) {
				alert('Your team is full');
				return;
			}
		}
		if (teamTwo.captainId === userId) {
			if (newBidAmount + teamTwoSpend > startingAmount) {
				alert('You do not have enough funds to bid this amount');
				return;
			}
			if (teamTwo.playerIds.length === match.participants.length / 2) {
				alert('Your team is full');
				return;
			}
		}

		client.mutation(api.bids.newBid, {
			matchId,
			amount: newBidAmount,
			playerId: auctionState.displayedPlayerId,
			bidderId: userId
		});
	};

	let startingAmount = $derived(match ? (match.participants.length - 2) * 25 : 0);
	let teamOneSpend = $derived(
		teamOne
			? winningBids
					.filter((b) => b.bidderId === teamOne.captainId)
					.reduce((acc, b) => acc + b.amount, 0)
			: 0
	);

	let teamTwoSpend = $derived(
		teamTwo
			? winningBids
					.filter((b) => b.bidderId === teamTwo.captainId)
					.reduce((acc, b) => acc + b.amount, 0)
			: 0
	);

	let remainingPlayers = $derived(
		match && teamOne && teamTwo
			? match.participants
					.filter(
						(p) =>
							![
								...teamOne.playerIds,
								...teamTwo.playerIds,
								auctionState?.displayedPlayerId
							].includes(p)
					)
					.sort((a, b) => {
						return getPlayerRating(b) - getPlayerRating(a);
					})
			: []
	);

	let auctioneerSelectedPlayerId = $state<Id<'players'> | undefined>();
	let displayedPlayer = $derived(
		auctionState?.displayedPlayerId
			? playersList.find((p) => p._id === auctionState.displayedPlayerId)
			: undefined
	);

	$effect(() => {
		if (!auctioneerSelectedPlayerId && match?.participants[0]) {
			auctioneerSelectedPlayerId = match.participants[0];
		}
	});

	const getPlayer = (playerId: Id<'players'>) => playersList.find((p) => p._id === playerId);
	const getPlayerRating = (playerId: Id<'players'>) => getPlayer(playerId)?.stats[0]?.rating ?? 0;
	const getPlayerPrice = (playerId: Id<'players'>) =>
		winningBids.find((bid) => bid.playerId === playerId)?.amount ?? 0;
	const getPreviousPrice = (playerId: Id<'players'>) => {
		const player = getPlayer(playerId);
		if (!player || !match) return 0;
		const currentIndex = player.stats.findIndex((stat) => stat.order === match.order);
		return player.stats[currentIndex + 1]?.price ?? 0;
	};

	const updateDisplayedPlayer = () => {
		if (!auctionState || !auctioneerSelectedPlayerId) return;
		client.mutation(api.auctions.setDisplayedPlayer, {
			auctionId: auctionState._id,
			playerId: auctioneerSelectedPlayerId
		});
	};

	const markBidAsWinner = () => {
		if (!topBid) return;
		client.mutation(api.bids.markWinningBid, {
			bidId: topBid._id
		});
	};

	const unmarkBidAsWinner = () => {
		if (!topBid) return;
		client.mutation(api.bids.unmarkWinningBid, {
			bidId: topBid._id
		});
	};

	const clearDisplayedPlayer = () => {
		if (!auctionState) return;
		client.mutation(api.auctions.setDisplayedPlayer, {
			auctionId: auctionState._id,
			playerId: null
		});
	};

	const closeAuction = () => {
		if (!auctionState) return;
		client.mutation(api.auctions.setAuction, {
			auctionId: auctionState._id,
			live: false
		});
	};

	const openAuction = () => {
		if (!auctionState) return;
		client.mutation(api.auctions.setAuction, {
			auctionId: auctionState._id,
			live: true
		});
	};
</script>

{#if match && auctionState && teamOne && teamTwo && !auction.isLoading && !allPlayers.isLoading}
	{#if permissions === 'auctioneer'}
		<div
			class="relative mb-4 flex w-full flex-col gap-4 bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-3 text-white sm:p-4"
		>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="flex flex-col gap-3">
					<div class="text-center font-medium text-xl">Displayed Player</div>
					<select
						class="min-h-11 w-full border-0 bg-zinc-700 text-white outline-none ring-0"
						bind:value={auctioneerSelectedPlayerId}
					>
						{#each match.participants as player (player)}
							<option value={player}>{getPlayer(player)?.name ?? 'Unknown player'}</option>
						{/each}
					</select>
					<button
						class="transition-all duration-300 bg-zinc-900 border-zinc-700 border-2 hover:bg-zinc-700
					min-h-11 px-4 uppercase cursor-pointer p-2 w-full"
						onclick={updateDisplayedPlayer}
					>
						Set Displayed Player
					</button>
					<button
						class="transition-all duration-300 bg-red-900 border-zinc-700 border-2 hover:bg-red-700
					min-h-11 px-4 uppercase cursor-pointer p-2 w-full"
						onclick={clearDisplayedPlayer}
					>
						Clear Displayed Player
					</button>
				</div>
				<div class="flex flex-col gap-3">
					<div class="text-center font-medium text-xl">Current Bid</div>
					<button
						class="transition-all duration-300 bg-green-900 border-zinc-700 border-2 hover:bg-green-700
					min-h-11 px-4 uppercase cursor-pointer p-2 w-full"
						onclick={markBidAsWinner}>Mark Bid As Winner</button
					>
					<button
						class="transition-all duration-300 bg-red-900 border-zinc-700 border-2 hover:bg-red-700
					min-h-11 px-4 uppercase cursor-pointer p-2 w-full"
						onclick={unmarkBidAsWinner}>Unmark Bid As Winner</button
					>
				</div>
				<div class="flex flex-col gap-3">
					<div class="text-center font-medium text-xl">Auction</div>
					<button
						class="transition-all duration-300 bg-zinc-900 border-zinc-700 border-2 hover:bg-zinc-700
					min-h-11 px-4 uppercase cursor-pointer p-2 w-full"
						onclick={openAuction}>Open Auction</button
					>
					<button
						class="transition-all duration-300 bg-zinc-900 border-zinc-700 border-2 hover:bg-zinc-700
					min-h-11 px-4 uppercase cursor-pointer p-2 w-full"
						onclick={closeAuction}
					>
						Close Auction
					</button>
				</div>
			</div>
		</div>
	{/if}
	<div
		class="relative mb-4 flex w-full flex-col gap-4 bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-3 text-white sm:p-4"
	>
		<RectangleEllipsis
			class="absolute top-4 right-4 cursor-pointer hover:text-gray-400"
			size={32}
			onclick={() => (showKeyPrompt = !showKeyPrompt)}
		/>
		{#if showKeyPrompt}
			<div
				class="absolute left-3 right-3 top-16 z-20 bg-zinc-800 p-4 shadow-lg sm:left-auto sm:w-64"
			>
				<label for="access-key" class="block mb-2 text-sm font-medium">Enter Access Key</label>
				<input
					id="access-key"
					type="password"
					bind:value={enteredKey}
					class="w-full px-2 py-1 bg-zinc-700 text-white border border-zinc-600 rounded focus:outline-none"
				/>
				{#if keyError}
					<div class="text-red-500 text-sm mt-1">{keyError}</div>
				{/if}
				<div class="flex justify-end gap-2 mt-3">
					<button
						class="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500"
						onclick={() => (showKeyPrompt = false)}>Cancel</button
					>
					<button class="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500" onclick={checkKey}
						>Submit</button
					>
				</div>
			</div>
		{/if}
		<div class="pr-11 text-center text-3xl font-medium sm:pr-0 sm:text-4xl">
			Burncastle {match.order} Auction
		</div>
		<div class="flex min-h-96 w-full flex-col gap-4 xl:flex-row">
			<div class="order-2 flex min-w-0 grow flex-col items-center gap-4 xl:order-1">
				<div class="flex flex-col gap-4 w-full items-center">
					<div class="text-center text-3xl font-medium sm:text-4xl">{teamOne.name}</div>
					<img
						src={`/players/${teamOne.captain?.nameId}.png`}
						alt={teamOne.name}
						class="md:w-32 md:h-32 w-16 h-16"
					/>
					<div class="flex items-center gap-2 text-center text-3xl font-medium sm:text-4xl">
						<div>£{startingAmount - teamOneSpend}</div>
						{#if topBid && !topBid.winningBid}
							{#if topBid.bidderId === teamOne.captain?._id}
								<div class="font-normal text-2xl">
									(£{startingAmount - teamOneSpend - topBid.amount})
								</div>
							{/if}
						{/if}
					</div>
				</div>
				<div class="flex flex-col gap-4 w-full items-center justify-center">
					<table class="w-full table-fixed">
						<thead>
							{#each teamOne.playerIds
								.slice()
								.filter((p) => p !== teamOne.captainId)
								.sort((a, b) => getPlayerRating(b) - getPlayerRating(a)) as player (player)}
								{@const playerData = getPlayer(player)}
								{@const price = getPlayerPrice(player)}
								{@const previousPrice = getPreviousPrice(player)}
								{#if playerData}
									<tr>
										<td class="h-12 w-12 sm:h-16 sm:w-16">
											<img
												src={`/players/${playerData.nameId}.png`}
												alt={playerData.name}
												class="h-12 w-12 sm:h-16 sm:w-16"
											/>
										</td>
										<td class="truncate px-2 text-left text-base sm:text-2xl">{playerData.name}</td>
										<td class="w-14 text-center text-base font-medium sm:w-16 sm:text-2xl"
											>£{price}</td
										>
										<td class="hidden w-24 text-center text-lg font-medium sm:table-cell">
											{#if previousPrice}
												{#if previousPrice > price}
													<span class="text-green-500">(- £{previousPrice - price})</span>
												{:else}
													<span class="text-red-500">(+ £{price - previousPrice})</span>
												{/if}
											{/if}
										</td>
									</tr>
								{/if}
							{/each}
						</thead>
					</table>
				</div>
			</div>
			<div
				class="order-1 flex w-full flex-col items-center gap-4 bg-black/15 px-2 py-4 xl:order-2 xl:w-96"
			>
				<div class=" mx-auto my-auto">
					{#if !auctionState.live}
						<span class="font-medium text-3xl">Auction Closed</span>
					{:else if !auctionState.displayedPlayerId}
						<div class="flex flex-col gap-4 items-center">
							<span class="font-medium text-3xl">Auction Live</span>
							<span class="text-lg">Please wait for a player to be selected</span>
						</div>
					{:else if displayedPlayer && displayedPlayer.stats[0]}
						<div class="flex flex-col gap-4 items-center">
							<div class="relative">
								<PlayerCard player={displayedPlayer} stats={displayedPlayer.stats[0]} />
								{#if topBid?.winningBid}
									<div
										class="absolute top-0 right-0 left-0 bottom-0 flex gap-2 items-center justify-center rotate-[315deg] text-red-500 font-bold text-7xl"
									>
										<div class="w-fit h-fit border-8 border-red-500 rounded-xl p-2">SOLD</div>
									</div>
								{/if}
							</div>
							{#if permissions === 'captain'}
								<div class="grid w-full max-w-xs grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
									<input
										step="1"
										type="number"
										pattern="[0-9]"
										bind:value={newBidAmountRaw}
										min={0}
										max={350}
										class="min-h-11 w-full border-0 bg-zinc-700 text-white outline-none ring-0"
									/>
									<button
										class="transition-all duration-300
					min-h-11 hover:bg-gradient-to-r hover:from-[rgba(255,215,0,0.1)] hover:to-[rgba(255,255,255,0.05)] hover:shadow-[0_0_4px_rgba(255,215,0,0.3)] border-2 hover:border-[rgba(255,215,0,0.1)] bg-zinc-900 border-zinc-800 px-4 uppercase cursor-pointer"
										onclick={() => submitBid()}
									>
										Submit Bid
									</button>
								</div>
							{/if}
							<div class="flex flex-col gap-2 items-center">
								<div class="font-medium text-3xl">Current Bid</div>
								{#if selectedPlayerBids.length === 0}
									<div class="text-white text-3xl">No bids</div>
								{:else if topBid}
									{@const highestBidder = getPlayer(topBid.bidderId)}
									<div
										class="flex flex-wrap items-center justify-center gap-2 text-2xl font-medium text-white sm:text-3xl"
									>
										£{topBid.amount}
										<span class="font-normal text-2xl">- {highestBidder?.name}</span>
									</div>
								{/if}
							</div>
							<div class="mt-6 text-2xl font-medium text-white sm:mt-16 sm:text-3xl">Breakdown</div>
							<table class="w-full max-w-80">
								<thead>
									<tr>
										<th class="text-lg font-medium text-left"></th>
										<th class="w-8">
											<div class=" flex justify-center items-center">£</div>
										</th>
										<th class="w-8">
											<div class=" flex justify-center items-center">
												<FootballIcon />
											</div>
										</th>
										<th class="w-8"
											><div class=" flex justify-center items-center">
												<FootballBootIcon />
											</div></th
										>
									</tr>
								</thead>
								<tbody class="w-full">
									{#each displayedPlayer.stats as { goals, assists, order, price, _id } (_id)}
										<tr class="w-full">
											<td class="text-lg font-medium">Burncastle {order}</td>

											<td class="w-12 text-center">£{price ?? 0}</td>
											<td class="w-12 text-center">{goals}</td>
											<td class="w-12 text-center">{assists}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
			<div class="order-3 flex min-w-0 grow flex-col items-center gap-4">
				<div class="flex flex-col gap-4 w-full items-center">
					<div class="text-center text-3xl font-medium sm:text-4xl">{teamTwo.name}</div>
					<img
						src={`/players/${teamTwo.captain?.nameId}.png`}
						alt={teamTwo.name}
						class="md:w-32 md:h-32 w-16 h-16"
					/>
					<div class="flex items-center gap-2 text-center text-3xl font-medium sm:text-4xl">
						<div>£{startingAmount - teamTwoSpend}</div>
						{#if topBid && !topBid.winningBid}
							{#if topBid.bidderId === teamTwo.captain?._id}
								<div class="font-normal text-2xl">
									(£{startingAmount - teamTwoSpend - topBid.amount})
								</div>
							{/if}
						{/if}
					</div>
				</div>
				<div class="flex flex-col gap-4 w-full items-center justify-center">
					<table class="w-full table-fixed">
						<tbody>
							{#each teamTwo.playerIds
								.slice()
								.filter((p) => p !== teamTwo.captainId)
								.sort((a, b) => {
									return getPlayerPrice(b) - getPlayerPrice(a);
								}) as player (player)}
								{@const playerData = getPlayer(player)}
								{@const price = getPlayerPrice(player)}
								{@const previousPrice = getPreviousPrice(player)}
								{#if playerData}
									<tr>
										<td class="hidden w-24 text-center text-lg font-medium sm:table-cell">
											{#if previousPrice}
												{#if previousPrice > price}
													<span class="text-green-500">(- £{previousPrice - price})</span>
												{:else}
													<span class="text-red-500">(+ £{price - previousPrice})</span>
												{/if}
											{/if}
										</td>
										<td class="w-14 text-center text-base font-medium sm:w-16 sm:text-2xl"
											>£{price}</td
										>
										<td class="truncate px-2 text-right text-base sm:text-2xl">{playerData.name}</td
										>
										<td class="h-12 w-12 sm:h-16 sm:w-16">
											<img
												src={`/players/${playerData.nameId}.png`}
												alt={playerData.name}
												class="h-12 w-12 sm:h-16 sm:w-16"
											/>
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
		{#if remainingPlayers.length}
			<div class="text-3xl font-medium text-center">Remaining Players</div>
			<div class="flex w-full flex-wrap gap-4 items-center justify-center">
				{#each remainingPlayers as player (player)}
					{@const playerData = getPlayer(player)}
					{#if playerData && playerData.stats[0]}
						<PlayerCard player={playerData} stats={playerData.stats[0]} />
					{/if}
				{/each}
			</div>
		{/if}
	</div>
{/if}
