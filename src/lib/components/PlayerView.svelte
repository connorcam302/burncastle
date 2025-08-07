<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import { api } from '../../convex/_generated/api';
	import type { Doc } from '../../convex/_generated/dataModel';
	import PlayerCard from './PlayerCard.svelte';

	import FootballIcon from './icons/FootballIcon.svelte';
	import FootballBootIcon from './icons/FootballBootIcon.svelte';

	type Player = Doc<'players'>;
	type Stats = Doc<'stats'>;
	type StatsWithOrder = Stats & { order: number; price: number };

	let { player, stats }: { player: Player; stats: StatsWithOrder[] } = $props();

	$inspect(player, stats);

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
			{ goals: 0, assists: 0, positions: [], count: 0, totalPrice: 0, appearances: 0, captains: 0 }
		)
	);

	let containerHeight = 300; // Initial fallback height

	let selectedStatIndex = $state(0);

	$effect(() => {
		player._id;

		selectedStatIndex = 0;
	});
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
							<PlayerCard {player} stats={stats[selectedStatIndex]} />
						{/key}
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex gap-2 items-center flex-col">
							<div class="text-white text-3xl font-bold">Match Stats</div>
							<table class="w-full">
								<tbody>
									<tr>
										<td class="text-lg font-medium">Position</td>
										<td class="w-16">{stats[selectedStatIndex].position}</td>
									</tr>
									<tr>
										<td class="text-lg font-medium">Goals</td>
										<td>{stats[selectedStatIndex].goals}</td>
									</tr>
									<tr>
										<td class="text-lg font-medium">Assists</td>
										<td>{stats[selectedStatIndex].assists}</td>
									</tr>
									{#if stats[selectedStatIndex].price}
										<tr>
											<td class="text-lg font-medium">Price</td>
											<td>£{Math.round((stats[selectedStatIndex].price * 100) / 100).toFixed(2)}</td
											>
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
									<td
										>£{Math.round(
											(stats
												.slice()
												.filter(({ price, isCaptain }) => price && !isCaptain)
												.sort((a, b) => b.price - a.price)[0].price *
												100) /
												100
										).toFixed(2)}</td
									>
								</tr>
								<tr>
									<td class="text-lg font-medium">Min Price</td>
									<td
										>£{Math.round(
											(stats
												.slice()
												.filter(({ price, isCaptain }) => price && !isCaptain)
												.sort((a, b) => a.price - b.price)[0].price *
												100) /
												100
										).toFixed(2)}</td
									>
								</tr>
								<tr>
									<td class="text-lg font-medium">Avg Price</td>
									<td
										>£{(
											Math.round((allTimeStats.totalPrice * 100) / allTimeStats.count) / 100
										).toFixed(2)}</td
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
