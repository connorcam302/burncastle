<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import FootballIcon from '$lib/components/icons/FootballIcon.svelte';
	import FootballBootIcon from '$lib/components/icons/FootballBootIcon.svelte';
	import { RectangleEllipsis } from '@lucide/svelte';

	let { data } = $props();
	const client = useConvexClient();

	let { matchId } = data;

	let auction = $derived(useQuery(api.auctions.get, { matchId }));
	let allPlayers = $derived(useQuery(api.players.getAll, {}));

	let showKeyPrompt = $state(false);
	let enteredKey = $state('');
	let keyError = $state('');

	const checkKey = () => {
		if (allPlayers.data.find((p) => p._id === enteredKey)) {
			localStorage.setItem('userId', enteredKey);
			showKeyPrompt = false;
			userId = enteredKey;
		} else {
			keyError = 'Invalid Key';
			setTimeout(() => (keyError = ''), 1500);
		}
	};

	let userId = $state(localStorage.getItem('userId'));

	const getPermissions = (userId: string) => {
		if (
			userId === auction.data?.teams[0].captainId ||
			userId === auction.data?.teams[1].captainId
		) {
			return 'captain';
		}
		if (auction?.data?.auction?.auctioneers?.includes(userId)) {
			return 'auctioneer';
		}
	};

	let permissions = $derived(userId && getPermissions(userId));

	let winningBids = $derived(auction.data?.bids?.filter((b) => b.winningBid === true));

	let bidsOnSelectedPlayer = $derived(
		auction?.data &&
			auction?.data?.auction?.displayedPlayerId &&
			useQuery(api.bids.getOnePlayer, { playerId: auction.data.auction.displayedPlayerId, matchId })
	);

	let newBidAmount = $state(0);

	const submitBid = () => {
		if (!(newBidAmount > 0) || !(bidsOnSelectedPlayer?.data[0]?.amount < newBidAmount)) {
			alert('Bid must be greater than 0 and greater than the current bid');
			return;
		}

		client.mutation(api.bids.newBid, {
			matchId,
			amount: newBidAmount,
			playerId: auction?.data?.auction?.displayedPlayerId,
			bidderId: userId
		});
	};

	$inspect(bidsOnSelectedPlayer);

	let startingAmount = $derived((auction.data?.participants?.length - 2) * 25);
	let teamOneSpend = $derived(
		winningBids &&
			winningBids
				.filter((b) => b.bidderId === auction.data.teams[0].captainId)
				.reduce((acc, b) => acc + b.amount, 0)
	);

	let teamTwoSpend = $derived(
		winningBids &&
			winningBids
				.filter((b) => b.bidderId === auction.data.teams[1].captainId)
				.reduce((acc, b) => acc + b.amount, 0)
	);

	let remainingPlayers = $derived(
		allPlayers.data &&
			auction.data &&
			auction.data.participants
				.filter(
					(p) =>
						![
							...auction.data.teams[0].playerIds,
							...auction.data.teams[1].playerIds,
							auction.data.auction.displayedPlayerId
						].includes(p)
				)
				.sort((a, b) => {
					const playerA = allPlayers.data.find((p) => p._id === a);
					const playerB = allPlayers.data.find((p) => p._id === b);
					return playerA.stats[0].rating < playerB.stats[0].rating ? 1 : -1;
				})
	);

	let auctioneerSelectedPlayerId = $derived(auction.data && auction.data.participants[0]);
	let auctioneerSelectedPlayer = $derived(
		auctioneerSelectedPlayerId && allPlayers.data.find((p) => p._id === auctioneerSelectedPlayerId)
	);

	const updateDisplayedPlayer = () => {
		console.log(auctioneerSelectedPlayerId, auction.data._id);
		client.mutation(api.auctions.setDisplayedPlayer, {
			auctionId: auction.data?.auction?._id,
			playerId: auctioneerSelectedPlayerId
		});
	};

	const markBidAsWinner = () => {
		client.mutation(api.bids.markWinningBid, {
			bidId: bidsOnSelectedPlayer?.data[0]?._id
		});
	};

	const unmarkBidAsWinner = () => {
		client.mutation(api.bids.unmarkWinningBid, {
			bidId: bidsOnSelectedPlayer?.data[0]?._id
		});
	};

	const clearDisplayedPlayer = () => {
		client.mutation(api.auctions.setDisplayedPlayer, {
			auctionId: auction.data?.auction?._id,
			playerId: null
		});
	};

	const closeAuction = () => {
		client.mutation(api.auctions.setAuction, {
			auctionId: auction.data?.auction?._id,
			live: false
		});
	};

	$inspect(auction, allPlayers, winningBids, remainingPlayers);
</script>

{#if auction.data !== undefined && !auction.isLoading && allPlayers.data !== undefined && !allPlayers.isLoading}
	{#if permissions === 'auctioneer'}
		<div
			class="w-full bg-gradient-to-r from-[#0a0e13]/95 border-0 to-[#1e2c3a]/95 text-white p-4 flex flex-col gap-4 mb-4 relative"
		>
			<div class="flex gap-4 items-center">
				<select
					class="bg-zinc-700 text-white outline-none ring-0 border-0 w-32"
					bind:value={auctioneerSelectedPlayerId}
				>
					{#each auction.data.participants as player (player)}
						<option value={player}>{allPlayers.data.find((p) => p._id === player).name}</option>
					{/each}
				</select>
				<button
					class="transition-all duration-300
					hover:bg-gradient-to-r hover:from-[rgba(255,215,0,0.1)] hover:to-[rgba(255,255,255,0.05)] hover:shadow-[0_0_4px_rgba(255,215,0,0.3)] border-2 hover:border-[rgba(255,215,0,0.1)] bg-zinc-900 border-zinc-800 px-4 uppercase cursor-pointer p-2"
					onclick={updateDisplayedPlayer}
				>
					Set Displayed Player
				</button>
				<button
					class="transition-all duration-300 hover:bg-gradient-to-r hover:from-[rgba(255,215,0,0.1)] hover:to-[rgba(255,255,255,0.05)] hover:shadow-[0_0_4px_rgba(255,215,0,0.3)] border-2 hover:border-[rgba(255,215,0,0.1)] bg-zinc-900 border-zinc-800 px-4 uppercase cursor-pointer p-2"
					onclick={markBidAsWinner}>Mark Bid As Winner</button
				>
				<button
					class="transition-all duration-300 hover:bg-gradient-to-r hover:from-[rgba(255,215,0,0.1)] hover:to-[rgba(255,255,255,0.05)] hover:shadow-[0_0_4px_rgba(255,215,0,0.3)] border-2 hover:border-[rgba(255,215,0,0.1)] bg-zinc-900 border-zinc-800 px-4 uppercase cursor-pointer p-2"
					onclick={unmarkBidAsWinner}>Unmark Bid As Winner</button
				>
				<button
					class="transition-all duration-300
					hover:bg-gradient-to-r hover:from-[rgba(255,215,0,0.1)] hover:to-[rgba(255,255,255,0.05)] hover:shadow-[0_0_4px_rgba(255,215,0,0.3)] border-2 hover:border-[rgba(255,215,0,0.1)] bg-zinc-900 border-zinc-800 px-4 uppercase cursor-pointer p-2"
					onclick={clearDisplayedPlayer}
				>
					Clear Displayed Player
				</button>
			</div>
		</div>
	{/if}
	<div
		class="w-full bg-gradient-to-r from-[#0a0e13]/95 border-0 to-[#1e2c3a]/95 text-white p-4 flex flex-col gap-4 mb-4 relative"
	>
		<RectangleEllipsis
			class="absolute top-4 right-4 cursor-pointer hover:text-gray-400"
			size={32}
			onclick={() => (showKeyPrompt = !showKeyPrompt)}
		/>
		{#if showKeyPrompt}
			<div class="absolute top-16 right-4 bg-zinc-800 p-4 rounded-lg shadow-lg w-64">
				<label class="block mb-2 text-sm font-medium">Enter Access Key</label>
				<input
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
		<div class="text-center font-medium text-4xl">Burncastle {auction.data.order} Auction</div>
		<div class="flex w-full gap-4 min-h-96">
			<div class="flex flex-col gap-4 items-center">
				<div class="flex flex-col gap-4 w-full items-center">
					<div class="text-center font-medium text-4xl">{auction.data.teams[0].name}</div>
					<img
						src={`/players/${auction.data.teams[0].captain?.nameId}.png`}
						alt={auction.data.teams[0].name}
						class="md:w-32 md:h-32 w-16 h-16"
					/>
					<div class="text-center font-medium text-4xl flex items-center gap-2">
						<div>£{startingAmount - teamOneSpend}</div>
						{#if bidsOnSelectedPlayer?.data?.length !== 0 && bidsOnSelectedPlayer?.data && !bidsOnSelectedPlayer?.data[0].winningBid}
							{#if bidsOnSelectedPlayer?.data[0]?.bidderId === auction?.data?.teams[0]?.captain?._id}
								<div class="font-normal text-2xl">
									(£{startingAmount - teamOneSpend - bidsOnSelectedPlayer?.data[0]?.amount})
								</div>
							{/if}
						{/if}
					</div>
				</div>
				<div class="flex flex-col gap-4 w-full items-center justify-center">
					{#each auction.data.teams[0].playerIds
						.slice()
						.filter((p) => p !== auction.data.teams[0].captainId)
						.sort((a, b) => {
							const playerA = allPlayers.data.find((p) => p._id === a);
							const playerB = allPlayers.data.find((p) => p._id === b);
							return playerA.stats[0].rating < playerB.stats[0].rating ? 1 : -1;
						}) as player (player)}
						{@const playerData = allPlayers.data.find((p) => p._id === player)}
						{@const price = winningBids.find((b) => b.playerId === player)?.amount ?? 0}
						{@const previousPrice =
							playerData.stats[
								playerData.stats.findIndex((s) => s.order === auction.data.order) + 1
							]?.price ?? 0}
						<div class="flex gap-4 w-full items-center justify-start">
							<img
								src={`/players/${playerData.nameId}.png`}
								alt={playerData.name}
								class="md:w-16 md:h-16 w-16 h-16"
							/>
							<div class="text-center font-medium text-lg w-16">
								{#if previousPrice}
									{#if previousPrice > price}
										<span class="text-green-500">(- £{previousPrice - price})</span>
									{:else}
										<span class="text-red-500">(+ £{price - previousPrice})</span>
									{/if}
								{/if}
							</div>
							<div class="text-center font-medium text-2xl w-16">£{price}</div>
							<div class="text-center text-2xl">{playerData.name}</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="flex flex-col gap-4 items-center grow bg-black/15 py-4">
				<div class=" mx-auto my-auto">
					{#if !auction.data.auction.live}
						<span class="font-medium text-3xl">Auction Closed</span>
					{:else if !auction.data.auction.displayedPlayerId}
						<div class="flex flex-col gap-4 items-center">
							<span class="font-medium text-3xl">Auction Live</span>
							<span class="text-lg">Please wait for a player to be selected</span>
						</div>
					{:else if auction.data.auction.displayedPlayerId}
						{@const displayedPlayer = allPlayers.data.find(
							(p) => p._id === auction.data.auction.displayedPlayerId
						)}
						<div class="flex flex-col gap-4 items-center">
							<div class="relative">
								<PlayerCard player={displayedPlayer} stats={displayedPlayer.stats[0]} />
								{#if bidsOnSelectedPlayer?.data && bidsOnSelectedPlayer?.data[0]?.winningBid}
									<div
										class="absolute top-0 right-0 left-0 bottom-0 flex gap-2 items-center justify-center rotate-[315deg] text-red-500 font-bold text-7xl"
									>
										<div class="w-fit h-fit border-8 border-red-500 rounded-xl p-2">SOLD</div>
									</div>
								{/if}
							</div>
							{#if permissions === 'captain'}
								<div class="flex gap-2">
									<input
										type="number"
										bind:value={newBidAmount}
										min={0}
										max={350}
										class="text-white outline-none ring-0 bg-zinc-700 w-44 border-0"
									/>
									<button
										class="transition-all duration-300
					hover:bg-gradient-to-r hover:from-[rgba(255,215,0,0.1)] hover:to-[rgba(255,255,255,0.05)] hover:shadow-[0_0_4px_rgba(255,215,0,0.3)] border-2 hover:border-[rgba(255,215,0,0.1)] bg-zinc-900 border-zinc-800 px-4 uppercase cursor-pointer"
										onclick={() => submitBid()}
									>
										Submit Bid
									</button>
								</div>
							{/if}
							<div class="flex flex-col gap-2 items-center">
								<div class="font-medium text-3xl">Current Bid</div>
								{#if bidsOnSelectedPlayer?.data?.length === 0}
									<div class="text-white text-3xl">No bids</div>
								{:else if bidsOnSelectedPlayer?.data?.length > 0}
									{@const highestBidder = allPlayers.data.find(
										(p) => p._id === bidsOnSelectedPlayer?.data[0]?.bidderId
									)}
									<div class="text-white text-3xl font-medium flex items-center gap-2">
										£{bidsOnSelectedPlayer?.data[0]?.amount}
										<span class="font-normal text-2xl">- {highestBidder?.name}</span>
									</div>
								{/if}
							</div>
							<div class="text-white text-3xl font-medium mt-16">Breakdown</div>
							<table class="w-80">
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
			<div class="flex flex-col gap-4 items-center">
				<div class="flex flex-col gap-4 w-full items-center">
					<div class="text-center font-medium text-4xl">{auction.data.teams[1].name}</div>
					<img
						src={`/players/${auction.data.teams[1].captain?.nameId}.png`}
						alt={auction.data.teams[1].name}
						class="md:w-32 md:h-32 w-16 h-16"
					/>
					<div class="text-center font-medium text-4xl flex items-center gap-2">
						<div>£{startingAmount - teamTwoSpend}</div>
						{#if bidsOnSelectedPlayer?.data?.length !== 0 && bidsOnSelectedPlayer?.data && !bidsOnSelectedPlayer?.data[0].winningBid}
							{#if bidsOnSelectedPlayer?.data[0]?.bidderId === auction?.data?.teams[1]?.captain?._id}
								<div class="font-normal text-2xl">
									(£{startingAmount - teamTwoSpend - bidsOnSelectedPlayer?.data[0]?.amount})
								</div>
							{/if}
						{/if}
					</div>
				</div>
				<div class="flex flex-col gap-4 w-full items-center justify-center">
					{#each auction.data.teams[1].playerIds
						.slice()
						.filter((p) => p !== auction.data.teams[1].captainId)
						.sort((a, b) => {
							const playerA = winningBids.find((p) => p.playerId === a) ?? { amount: 0 };
							const playerB = winningBids.find((p) => p.playerId === b) ?? { amount: 0 };
							return playerA.amount < playerB.amount ? 1 : -1;
						}) as player (player)}
						{@const playerData = allPlayers.data.find((p) => p._id === player)}
						{@const price = winningBids.find((b) => b.playerId === player)?.amount ?? 0}
						{@const previousPrice =
							playerData.stats[
								playerData.stats.findIndex((s) => s.order === auction.data.order) + 1
							]?.price ?? 0}
						<div class="flex gap-4 w-full items-center justify-end">
							<div class="text-center text-2xl">{playerData.name}</div>
							<div class="text-center font-medium text-2xl w-16">£{price}</div>
							<div class="text-center font-medium text-lg w-16">
								{#if previousPrice}
									{#if previousPrice > price}
										<span class="text-green-500">(- £{previousPrice - price})</span>
									{:else}
										<span class="text-red-500">(+ £{price - previousPrice})</span>
									{/if}
								{/if}
							</div>
							<img
								src={`/players/${playerData.nameId}.png`}
								alt={playerData.name}
								class="md:w-16 md:h-16 w-16 h-16"
							/>
						</div>
					{/each}
				</div>
			</div>
		</div>
		{#if remainingPlayers.length}
			<div class="text-3xl font-medium text-center">Remaining Players</div>
			<div class="flex w-full flex-wrap gap-4 items-center justify-center">
				{#each remainingPlayers as player (player)}
					{@const playerData = allPlayers.data.find((p) => p._id === player)}
					<PlayerCard player={playerData} stats={playerData.stats[0]} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
