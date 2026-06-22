<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { FunctionReturnType } from 'convex/server';
	import { api } from '../../convex/_generated/api';
	import PlayerCard from './PlayerCard.svelte';

	import FootballIcon from './icons/FootballIcon.svelte';
	import FootballBootIcon from './icons/FootballBootIcon.svelte';

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

	let { player, stats }: { player: Player; stats: StatsWithOrder[] } = $props();

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

	$effect(() => {
		player._id;

		selectedStatIndex = 0;
	});

	function statIcons(count: number) {
		return Array.from({ length: Math.max(0, count) });
	}
</script>

<!-- Container with relative positioning and a min-height -->
<div class="relative w-full overflow-hidden" style="min-height: {containerHeight}px;">
	{#key player._id}
		<div
			class="h-full flex flex-col gap-2 w-full bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 text-white absolute top-0 left-0 p-4 uppercase"
			in:fly={{ x: 300, duration: 400, delay: 200 }}
			out:fly={{ x: -300, duration: 400 }}
			bind:clientHeight={containerHeight}
		>
			<div class="flex flex-wrap gap-4">
				<div class="flex gap-4">
					<div class="flex gap-2 flex-col">
						<select
							class="text-white outline-none ring-0 bg-zinc-700 w-44 border-0"
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
					<div class="flex flex-col gap-2">
						<div class="flex gap-2 items-center flex-col">
							<div class="text-white text-3xl font-bold">Match Stats</div>
							<table class="w-full">
								<tbody>
									{#if selectedStat}
										<tr>
											<td class="text-lg font-medium">Position</td>
											<td class="w-16">{selectedStat.position}</td>
										</tr>
										<tr>
											<td class="text-lg font-medium">Goals</td>
											<td>
												<div
													class="flex flex-wrap items-center gap-1 text-lg"
													aria-label={`${selectedStat.goals} goals`}
												>
													{#each statIcons(selectedStat.goals) as _}
														<FootballIcon />
													{/each}
													{#if selectedStat.goals === 0}
														<span>-</span>
													{/if}
												</div>
											</td>
										</tr>
										<tr>
											<td class="text-lg font-medium">Assists</td>
											<td>
												<div
													class="flex flex-wrap items-center gap-1 text-lg"
													aria-label={`${selectedStat.assists} assists`}
												>
													{#each statIcons(selectedStat.assists) as _}
														<FootballBootIcon />
													{/each}
													{#if selectedStat.assists === 0}
														<span>-</span>
													{/if}
												</div>
											</td>
										</tr>
									{/if}
									{#if selectedStat?.price}
										<tr>
											<td class="text-lg font-medium">Price</td>
											<td>£{Math.round((selectedStat.price * 100) / 100).toFixed(2)}</td>
										</tr>
									{/if}
								</tbody>
							</table>
						</div>
					</div>
				</div>
				<div class="self-stretch w-1 h-full">
					<div class="bg-white/25 w-1 h-full"></div>
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex gap-2 items-center flex-col w-48">
						<div class="text-white text-3xl font-bold">All Time</div>
						<table class="w-full">
							<tbody class="w-full">
								<tr class="w-full">
									<td class="text-lg font-medium">Appearances</td>
									<td>{allTimeStats.appearances}</td>
								</tr>
								<tr class="w-full">
									<td class="text-lg font-medium">Position</td>
									<td>{allTimeStats.positions}</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Goals</td>
									<td>
										<div
											class="flex flex-wrap items-center gap-1 text-lg max-w-28"
											aria-label={`${allTimeStats.goals} goals`}
										>
											{#each statIcons(allTimeStats.goals) as _}
												<FootballIcon />
											{/each}
											{#if allTimeStats.goals === 0}
												<span>-</span>
											{/if}
										</div>
									</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Assists</td>
									<td>
										<div
											class="flex flex-wrap items-center gap-1 text-lg max-w-28"
											aria-label={`${allTimeStats.assists} assists`}
										>
											{#each statIcons(allTimeStats.assists) as _}
												<FootballBootIcon />
											{/each}
											{#if allTimeStats.assists === 0}
												<span>-</span>
											{/if}
										</div>
									</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Captaincies</td>
									<td>{allTimeStats.captains}</td>
								</tr>
								<tr>
									<td class="text-lg font-medium">Max Price</td>
									<td
										>{#if maxPrice?.price}£{Math.round(maxPrice.price * 100) / 100}{:else}-{/if}</td
									>
								</tr>
								<tr>
									<td class="text-lg font-medium">Min Price</td>
									<td
										>{#if minPrice?.price}£{Math.round(minPrice.price * 100) / 100}{:else}-{/if}</td
									>
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
				<div class="self-stretch w-1 h-full">
					<div class="bg-white/25 w-1 h-full"></div>
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex gap-2 items-center flex-col w-48">
						<div class="text-white text-3xl font-bold">Auctions</div>
						<table class="w-full">
							<tbody class="w-full">
								{#each stats as { price, order, _id } (_id)}
									{#if price}
										<tr class="w-full">
											<td class="text-lg font-medium">Burncastle {order}</td>
											<td>£{price}</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				</div>
				<div class="self-stretch w-1 h-full">
					<div class="bg-white/25 w-1 h-full"></div>
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex gap-2 items-center flex-col w-56">
						<div class="text-white text-3xl font-bold">Breakdown</div>
						<table class="w-full">
							<thead>
								<tr>
									<th class="text-lg font-medium text-left">Match</th>
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
								{#each stats as { goals, assists, order, _id } (_id)}
									<tr class="w-full">
										<td class="text-lg font-medium">Burncastle {order}</td>
										<td class="w-8">
											<div
												class="flex flex-wrap justify-center items-center gap-0.5 text-base"
												aria-label={`${goals} goals`}
											>
												{#each statIcons(goals) as _}
													<FootballIcon />
												{/each}
												{#if goals === 0}
													<span>-</span>
												{/if}
											</div>
										</td>
										<td class="w-8">
											<div
												class="flex flex-wrap justify-center items-center gap-0.5 text-base"
												aria-label={`${assists} assists`}
											>
												{#each statIcons(assists) as _}
													<FootballBootIcon />
												{/each}
												{#if assists === 0}
													<span>-</span>
												{/if}
											</div>
										</td>
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
