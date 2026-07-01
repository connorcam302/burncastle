<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { FunctionReturnType } from 'convex/server';
	import { api } from '../../convex/_generated/api';
	import PlayerCard from './PlayerCard.svelte';
	import FootballBootIcon from './icons/FootballBootIcon.svelte';
	import FootballIcon from './icons/FootballIcon.svelte';

	type Player = FunctionReturnType<typeof api.players.getAll>[number];
	type StatsWithOrder = Player['stats'][number];
	type AllTimeStats = {
		goals: number;
		assists: number;
		positions: string[];
		count: number;
		totalPrice: number;
		appearances: number;
		captains: number;
	};

	let {
		player,
		stats,
		showProfileLink = true
	}: { player: Player; stats: StatsWithOrder[]; showProfileLink?: boolean } = $props();

	const parsedStats = $derived(
		stats.map((s) => {
			return { ...s, ...JSON.parse(s.breakdown) };
		})
	);

	const allTimeStats = $derived(
		stats.reduce(
			(acc, s) => {
				// Calculate the new totals for goals and assists
				const totalGoals = acc.goals + s.goals;
				const totalAssists = acc.assists + s.assists;
				let totalPrice = acc.totalPrice;
				acc.appearances++;
				if (s.price) {
					totalPrice += s.price;
					acc.count++;
				}
				if (s.isCaptain) {
					acc.captains++;
				}

				// Accumulate the position data

				if (!acc.positions.includes(s.position)) {
					acc.positions.push(s.position);
				}

				return {
					goals: totalGoals,
					assists: totalAssists,
					positions: acc.positions,
					count: acc.count,
					totalPrice: totalPrice,
					appearances: acc.appearances,
					captains: acc.captains
				};
			},
			// The initial value for the accumulator
			{
				goals: 0,
				assists: 0,
				positions: [],
				count: 0,
				totalPrice: 0,
				appearances: 0,
				captains: 0
			} as AllTimeStats
		)
	);

	let containerHeight = $state(300);

	let selectedStatIndex = $state(0);
	const selectedStat = $derived(stats[selectedStatIndex]);
	const prices = $derived(stats.filter(({ price, isCaptain }) => price && !isCaptain));
	const maxPrice = $derived(prices.slice().sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0]);
	const minPrice = $derived(prices.slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0]);
	const avgPrice = $derived(
		allTimeStats.count > 0
			? (Math.round((allTimeStats.totalPrice * 100) / allTimeStats.count) / 100).toFixed(2)
			: undefined
	);
	const positionsText = $derived(allTimeStats.positions.join(', ') || '-');
	const auctionRows = $derived(stats.filter(({ price }) => price));

	$effect(() => {
		player._id;

		selectedStatIndex = 0;
	});

	function formatPrice(price?: number) {
		return price ? `£${Math.round(price * 100) / 100}` : '-';
	}
</script>

<!-- Container with relative positioning and a min-height -->
<div
	class="relative w-full overflow-hidden md:min-h-[var(--player-view-height)]"
	style="--player-view-height: {containerHeight}px;"
>
	{#key player._id}
		<div
			class="relative flex h-full w-full flex-col gap-4 bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-3 text-white uppercase sm:p-4"
			in:fly={{ x: 300, duration: 400, delay: 200 }}
			out:fly={{ x: -300, duration: 400 }}
			bind:clientHeight={containerHeight}
		>
			<div class="grid grid-cols-1 gap-4 md:hidden">
				<section class="min-w-0 border border-white/10 bg-zinc-950/35 p-3 sm:p-4">
					<div class="mb-3 flex items-center justify-between gap-3">
						<div>
							<div class="text-sm font-bold text-highlight">Selected Card</div>
							<div class="text-2xl font-bold leading-none text-white">{player.name}</div>
						</div>
						{#if showProfileLink}
							<a
								href={`/players/${player._id}`}
								class="min-h-11 shrink-0 border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-bold uppercase hover:bg-zinc-800"
							>
								Profile
							</a>
						{/if}
					</div>

					<div class="flex min-w-0 flex-col gap-4 sm:flex-row">
						<div class="mx-auto flex flex-col gap-2 sm:mx-0">
							<select
								class="w-40 border-0 bg-zinc-700 text-white outline-none ring-0 sm:w-44"
								bind:value={selectedStatIndex}
							>
								{#each parsedStats as stat, i (i)}
									<option value={i}>Burncastle {stat.order}</option>
								{/each}
							</select>
							{#key selectedStatIndex}
								{#if selectedStat}
									<PlayerCard {player} stats={selectedStat} />
								{/if}
							{/key}
						</div>
						<div class="grid min-w-0 flex-1 grid-cols-2 content-start gap-2">
							{#if selectedStat}
								<div class="border border-white/10 bg-zinc-950/50 p-3">
									<div class="text-xs font-bold text-zinc-300">Position</div>
									<div class="text-2xl font-bold">{selectedStat.position}</div>
								</div>
								<div class="border border-white/10 bg-zinc-950/50 p-3">
									<div class="text-xs font-bold text-zinc-300">Rating</div>
									<div class="text-2xl font-bold">{selectedStat.rating}</div>
								</div>
								<div class="border border-white/10 bg-zinc-950/50 p-3">
									<div class="flex items-center gap-1 text-xs font-bold text-zinc-300">
										<FootballIcon />
										Goals
									</div>
									<div class="text-2xl font-bold">{selectedStat.goals}</div>
								</div>
								<div class="border border-white/10 bg-zinc-950/50 p-3">
									<div class="flex items-center gap-1 text-xs font-bold text-zinc-300">
										<FootballBootIcon />
										Assists
									</div>
									<div class="text-2xl font-bold">{selectedStat.assists}</div>
								</div>
								<div class="col-span-2 border border-white/10 bg-zinc-950/50 p-3">
									<div class="text-xs font-bold text-zinc-300">Auction Price</div>
									<div class="text-2xl font-bold">{formatPrice(selectedStat.price)}</div>
								</div>
							{/if}
						</div>
					</div>
				</section>

				<section class="min-w-0 border border-white/10 bg-zinc-950/35 p-3 sm:p-4">
					<div class="mb-3 text-2xl font-bold text-white">All Time</div>
					<div class="grid grid-cols-2 gap-2">
						<div class="border border-white/10 bg-zinc-950/50 p-3">
							<div class="text-xs font-bold text-zinc-300">Apps</div>
							<div class="text-3xl font-bold">{allTimeStats.appearances}</div>
						</div>
						<div class="border border-white/10 bg-zinc-950/50 p-3">
							<div class="text-xs font-bold text-zinc-300">Captain</div>
							<div class="text-3xl font-bold">{allTimeStats.captains}</div>
						</div>
						<div class="border border-white/10 bg-zinc-950/50 p-3">
							<div class="text-xs font-bold text-zinc-300">Goals</div>
							<div class="text-3xl font-bold">{allTimeStats.goals}</div>
						</div>
						<div class="border border-white/10 bg-zinc-950/50 p-3">
							<div class="text-xs font-bold text-zinc-300">Assists</div>
							<div class="text-3xl font-bold">{allTimeStats.assists}</div>
						</div>
						<div class="col-span-2 border border-white/10 bg-zinc-950/50 p-3">
							<div class="text-xs font-bold text-zinc-300">Positions</div>
							<div class="truncate text-xl font-bold">{positionsText}</div>
						</div>
					</div>

					<div class="mt-4 grid grid-cols-3 gap-2">
						<div class="border border-white/10 bg-zinc-950/50 p-2">
							<div class="text-[11px] font-bold text-zinc-300">Max</div>
							<div class="truncate text-lg font-bold">{formatPrice(maxPrice?.price)}</div>
						</div>
						<div class="border border-white/10 bg-zinc-950/50 p-2">
							<div class="text-[11px] font-bold text-zinc-300">Min</div>
							<div class="truncate text-lg font-bold">{formatPrice(minPrice?.price)}</div>
						</div>
						<div class="border border-white/10 bg-zinc-950/50 p-2">
							<div class="text-[11px] font-bold text-zinc-300">Avg</div>
							<div class="truncate text-lg font-bold">
								{#if avgPrice}£{avgPrice}{:else}-{/if}
							</div>
						</div>
					</div>
				</section>

				<section class="min-w-0 border border-white/10 bg-zinc-950/35 p-3 sm:p-4 lg:col-span-2">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
						<div>
							<div class="mb-3 text-xl font-bold text-white">Auction History</div>
							{#if auctionRows.length}
								<div class="flex flex-col gap-2">
									{#each auctionRows as { price, order, _id } (_id)}
										<div
											class="flex items-center justify-between border border-white/10 bg-zinc-950/50 px-3 py-2"
										>
											<span class="font-bold">Burncastle {order}</span>
											<span class="text-highlight">{formatPrice(price)}</span>
										</div>
									{/each}
								</div>
							{:else}
								<div class="border border-white/10 bg-zinc-950/50 p-3 text-zinc-300 normal-case">
									No auction prices recorded.
								</div>
							{/if}
						</div>

						<div>
							<div class="mb-3 text-xl font-bold text-white">Match Breakdown</div>
							<table class="w-full overflow-hidden text-sm">
								<thead>
									<tr class="border-b border-white/10 text-zinc-300">
										<th class="py-2 text-left font-bold">Match</th>
										<th class="w-12 py-2 text-center">
											<div class="flex items-center justify-center">
												<FootballIcon />
											</div>
										</th>
										<th class="w-12 py-2 text-center">
											<div class="flex items-center justify-center">
												<FootballBootIcon />
											</div>
										</th>
									</tr>
								</thead>
								<tbody class="w-full">
									{#each stats as { goals, assists, order, _id } (_id)}
										<tr class="border-b border-white/5 last:border-b-0">
											<td class="py-2 font-bold">Burncastle {order}</td>
											<td class="w-12 py-2 text-center">{goals}</td>
											<td class="w-12 py-2 text-center">{assists}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</section>
			</div>

			<div
				class="hidden gap-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(180px,auto)_minmax(180px,auto)] xl:grid-cols-[minmax(320px,auto)_1px_minmax(180px,auto)_1px_minmax(180px,auto)_1px_minmax(220px,auto)]"
			>
				<div class="flex min-w-0 flex-col gap-4 sm:flex-row">
					<div class="mx-auto flex flex-col gap-2 sm:mx-0">
						<select
							class="w-40 border-0 bg-zinc-700 text-white outline-none ring-0 sm:w-44"
							bind:value={selectedStatIndex}
						>
							{#each parsedStats as stat, i (i)}
								<option value={i}>Burncastle {stat.order}</option>
							{/each}
						</select>
						{#key selectedStatIndex}
							{#if selectedStat}
								<PlayerCard {player} stats={selectedStat} />
							{/if}
						{/key}
					</div>
					<div class="flex min-w-0 flex-col gap-2">
						<div class="flex flex-col items-center gap-2 sm:items-start">
							<div class="text-2xl font-bold text-white sm:text-3xl">Match Stats</div>
							<table class="w-full">
								<tbody>
									{#if selectedStat}
										<tr>
											<td class="text-lg font-medium">Position</td>
											<td class="w-16">{selectedStat.position}</td>
										</tr>
										<tr>
											<td class="text-lg font-medium">Goals</td>
											<td>{selectedStat.goals}</td>
										</tr>
										<tr>
											<td class="text-lg font-medium">Assists</td>
											<td>{selectedStat.assists}</td>
										</tr>
									{/if}
									{#if selectedStat?.price}
										<tr>
											<td class="text-lg font-medium">Price</td>
											<td>{formatPrice(selectedStat.price)}</td>
										</tr>
									{/if}
								</tbody>
							</table>
							{#if showProfileLink}
								<a
									href={`/players/${player._id}`}
									class="mt-2 min-h-11 border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold uppercase hover:bg-zinc-800"
								>
									View Player Page
								</a>
							{/if}
						</div>
					</div>
				</div>
				<div class="hidden self-stretch xl:block">
					<div class="h-full w-px bg-white/25"></div>
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex w-full flex-col items-center gap-2 sm:items-start xl:w-48">
						<div class="text-2xl font-bold text-white sm:text-3xl">All Time</div>
						<table class="w-full">
							<tbody class="w-full">
								<tr class="w-full">
									<td class="text-lg font-medium">Appearances</td>
									<td>{allTimeStats.appearances}</td>
								</tr>
								<tr class="w-full">
									<td class="text-lg font-medium">Position</td>
									<td>{positionsText}</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Goals</td>
									<td>{allTimeStats.goals}</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Assists</td>
									<td>{allTimeStats.assists}</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Captaincies</td>
									<td>{allTimeStats.captains}</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Max Price</td>
									<td>{formatPrice(maxPrice?.price)}</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Min Price</td>
									<td>{formatPrice(minPrice?.price)}</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Avg Price</td>
									<td
										>{#if avgPrice}£{avgPrice}{:else}-{/if}</td
									>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				<div class="hidden self-stretch xl:block">
					<div class="h-full w-px bg-white/25"></div>
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex w-full flex-col items-center gap-2 sm:items-start xl:w-48">
						<div class="text-2xl font-bold text-white sm:text-3xl">Auctions</div>
						<table class="w-full">
							<tbody class="w-full">
								{#each auctionRows as { price, order, _id } (_id)}
									<tr class="w-full">
										<td class="text-lg font-medium">Burncastle {order}</td>
										<td>{formatPrice(price)}</td>
									</tr>
								{/each}
								{#if !auctionRows.length}
									<tr>
										<td class="text-zinc-300 normal-case" colspan="2"
											>No auction prices recorded.</td
										>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>
				<div class="hidden self-stretch xl:block">
					<div class="h-full w-px bg-white/25"></div>
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex w-full flex-col items-center gap-2 sm:items-start xl:w-56">
						<div class="text-2xl font-bold text-white sm:text-3xl">Breakdown</div>
						<table class="w-full">
							<thead>
								<tr>
									<th class="text-lg font-medium text-left">Match</th>
									<th class="w-8">
										<div class="flex items-center justify-center">
											<FootballIcon />
										</div>
									</th>
									<th class="w-8">
										<div class="flex items-center justify-center">
											<FootballBootIcon />
										</div>
									</th>
								</tr>
							</thead>
							<tbody class="w-full">
								{#each stats as { goals, assists, order, _id } (_id)}
									<tr class="w-full">
										<td class="text-lg font-medium">Burncastle {order}</td>
										<td class="w-8 text-center">{goals}</td>
										<td class="w-8 text-center">{assists}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/key}
</div>
