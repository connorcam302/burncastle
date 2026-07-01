<script lang="ts">
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import FootballBootIcon from '$lib/components/icons/FootballBootIcon.svelte';
	import FootballIcon from '$lib/components/icons/FootballIcon.svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import { ArrowLeft, Banknote, Star, Trophy, Users } from '@lucide/svelte';
	import { useQuery } from 'convex-svelte';

	let { data } = $props();
	const playerId = data.playerId as Id<'players'>;
	const players = $derived(useQuery(api.players.getAll, {}));
	const player = $derived(players.data?.find((candidate) => candidate._id === playerId));
	const stats = $derived(player?.stats ?? []);
	const currentStats = $derived(stats[0]);
	let selectedCardIndex = $state(0);
	const selectedCardStats = $derived(stats[selectedCardIndex] ?? currentStats);

	function hasPrice(price: number | undefined | null) {
		return price !== undefined && price !== null;
	}

	function formatPrice(price: number) {
		return `£${Math.round(price * 100) / 100}`;
	}

	const totals = $derived(
		stats.reduce(
			(acc, stat) => ({
				goals: acc.goals + stat.goals,
				assists: acc.assists + stat.assists,
				appearances: acc.appearances + 1,
				captaincies: acc.captaincies + (stat.isCaptain ? 1 : 0),
				rating: acc.rating + stat.rating,
				auctionSpend: acc.auctionSpend + (stat.price ?? 0),
				paidAppearances: acc.paidAppearances + (hasPrice(stat.price) ? 1 : 0)
			}),
			{
				goals: 0,
				assists: 0,
				appearances: 0,
				captaincies: 0,
				rating: 0,
				auctionSpend: 0,
				paidAppearances: 0
			}
		)
	);

	const averageRating = $derived(
		totals.appearances ? Math.round((totals.rating / totals.appearances) * 10) / 10 : 0
	);
	const averagePrice = $derived(
		totals.paidAppearances
			? Math.round((totals.auctionSpend / totals.paidAppearances) * 100) / 100
			: undefined
	);
	const maxPrice = $derived(
		stats
			.filter((stat) => hasPrice(stat.price))
			.slice()
			.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0]
	);
	const bestRating = $derived(stats.slice().sort((a, b) => b.rating - a.rating)[0]);
	const bestGoals = $derived(stats.slice().sort((a, b) => b.goals - a.goals)[0]);
	const bestAssists = $derived(stats.slice().sort((a, b) => b.assists - a.assists)[0]);
	const bestGoalInvolvements = $derived(
		stats.slice().sort((a, b) => b.goals + b.assists - (a.goals + a.assists))[0]
	);
	const positions = $derived(
		Object.entries(
			stats.reduce(
				(acc, stat) => {
					acc[stat.position] = (acc[stat.position] ?? 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			)
		).sort((a, b) => b[1] - a[1])
	);
	const goalInvolvements = $derived(totals.goals + totals.assists);
	const involvementRate = $derived(
		totals.appearances ? Math.round((goalInvolvements / totals.appearances) * 100) / 100 : 0
	);

	$effect(() => {
		playerId;
		stats.length;
		selectedCardIndex = 0;
	});
</script>

<div class="flex w-full flex-col gap-4 text-white">
	<a
		href="/players"
		class="flex w-fit items-center gap-2 text-zinc-300 transition-colors hover:text-white"
	>
		<ArrowLeft size={18} />
		Players
	</a>

	{#if players.error}
		<div class="border-2 border-red-500/50 bg-red-950/60 p-4 normal-case">
			<div class="font-bold uppercase">Could not load player</div>
			<div>{players.error.message}</div>
		</div>
	{:else if players.isLoading}
		<div class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-6 text-zinc-300">
			Loading player...
		</div>
	{:else if !player}
		<div class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-6">
			<div class="text-2xl font-bold">Player not found</div>
			<div class="text-zinc-300 normal-case">This player id does not exist in Convex.</div>
		</div>
	{:else if !currentStats}
		<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-6">
			<div class="flex items-center gap-4">
				<img src={`/players/${player.nameId}.png`} alt={player.name} class="h-24 w-24" />
				<div>
					<div class="text-4xl font-bold">{player.name}</div>
					<div class="text-zinc-300 normal-case">No match stats have been recorded yet.</div>
				</div>
			</div>
		</section>
	{:else}
		<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4">
			<div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[176px_1fr]">
				<div class="mx-auto flex w-44 flex-none flex-col gap-3 lg:mx-0">
					<select
						class="w-full border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-white outline-none"
						bind:value={selectedCardIndex}
					>
						{#each stats as stat, index (stat._id)}
							<option value={index}>Burncastle {stat.order}</option>
						{/each}
					</select>
					{#if selectedCardStats}
						<PlayerCard {player} stats={selectedCardStats} />
					{/if}
				</div>
				<div class="flex flex-col justify-between gap-5">
					<div>
						<div class="text-sm text-zinc-300">Player Profile</div>
						<div class="text-5xl font-bold">{player.name}</div>
						{#if player.nickname}
							<div class="text-xl text-highlight">{player.nickname}</div>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-3 md:grid-cols-5">
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="flex items-center gap-2 text-zinc-300"><Trophy size={16} /> Apps</div>
							<div class="text-3xl font-bold">{totals.appearances}</div>
						</div>
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="flex items-center gap-2 text-zinc-300"><FootballIcon /> Goals</div>
							<div class="text-3xl font-bold">{totals.goals}</div>
						</div>
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="flex items-center gap-2 text-zinc-300"><FootballBootIcon /> Assists</div>
							<div class="text-3xl font-bold">{totals.assists}</div>
						</div>
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="flex items-center gap-2 text-zinc-300"><Star size={16} /> Avg Rating</div>
							<div class="text-3xl font-bold">{averageRating}</div>
						</div>
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Avg G/I</div>
							<div class="text-3xl font-bold">{involvementRate}</div>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Latest Position</div>
							<div class="text-xl font-bold">{currentStats.position}</div>
						</div>
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Captaincies</div>
							<div class="text-xl font-bold">{totals.captaincies}</div>
						</div>
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Goal Involvements</div>
							<div class="text-xl font-bold">{goalInvolvements}</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
			<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4">
				<div class="mb-3 text-2xl font-bold">Match History</div>
				<div class="overflow-x-auto">
					<table class="w-full min-w-[720px]">
						<thead>
							<tr class="border-b border-zinc-700 text-left text-sm text-zinc-300">
								<th class="py-2">Match</th>
								<th>Position</th>
								<th>Rating</th>
								<th>Goals</th>
								<th>Assists</th>
								<th>Price</th>
								<th>Captain</th>
							</tr>
						</thead>
						<tbody>
							{#each stats as stat (stat._id)}
								<tr class="border-b border-zinc-800">
									<td class="py-2">
										<a href={`/matches/${stat.matchId}`} class="font-bold hover:text-highlight">
											Burncastle {stat.order}
										</a>
									</td>
									<td>{stat.position}</td>
									<td>{stat.rating}</td>
									<td>{stat.goals}</td>
									<td>{stat.assists}</td>
									<td
										>{#if hasPrice(stat.price)}{formatPrice(stat.price)}{:else}-{/if}</td
									>
									<td>{stat.isCaptain ? 'Yes' : '-'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>

			<div class="flex flex-col gap-4">
				<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4">
					<div class="mb-3 flex items-center gap-2 text-2xl font-bold">
						<Star size={20} /> Record
					</div>
					<div class="grid grid-cols-2 gap-2">
						<div class="min-w-0 border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Best Rating</div>
							<div class="text-3xl font-bold">{bestRating?.rating ?? '-'}</div>
							<div class="truncate text-sm text-zinc-400">
								{#if bestRating}Burncastle {bestRating.order}{:else}-{/if}
							</div>
						</div>
						<div class="min-w-0 border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Best Goals</div>
							<div class="text-3xl font-bold">{bestGoals?.goals ?? '-'}</div>
							<div class="truncate text-sm text-zinc-400">
								{#if bestGoals}Burncastle {bestGoals.order}{:else}-{/if}
							</div>
						</div>
						<div class="min-w-0 border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Best Assists</div>
							<div class="text-3xl font-bold">{bestAssists?.assists ?? '-'}</div>
							<div class="truncate text-sm text-zinc-400">
								{#if bestAssists}Burncastle {bestAssists.order}{:else}-{/if}
							</div>
						</div>
						<div class="min-w-0 border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Best G/I</div>
							<div class="text-3xl font-bold">
								{#if bestGoalInvolvements}{bestGoalInvolvements.goals +
										bestGoalInvolvements.assists}{:else}-{/if}
							</div>
							<div class="truncate text-sm text-zinc-400">
								{#if bestGoalInvolvements}Burncastle {bestGoalInvolvements.order}{:else}-{/if}
							</div>
						</div>
					</div>
				</section>

				<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4">
					<div class="mb-3 flex items-center gap-2 text-2xl font-bold">
						<Banknote size={20} /> Auction Value
					</div>
					<div class="grid grid-cols-2 gap-2">
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Total</div>
							<div class="text-2xl font-bold">£{totals.auctionSpend}</div>
						</div>
						<div class="border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Average</div>
							<div class="text-2xl font-bold">
								{#if averagePrice !== undefined}{formatPrice(averagePrice)}{:else}-{/if}
							</div>
						</div>
						<div class="col-span-2 border border-zinc-700 bg-zinc-950/60 p-3">
							<div class="text-zinc-300">Highest</div>
							<div class="text-2xl font-bold">
								{#if hasPrice(maxPrice?.price)}{formatPrice(maxPrice.price)} at Burncastle {maxPrice.order}{:else}-{/if}
							</div>
						</div>
					</div>
				</section>

				<section class="bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-4">
					<div class="mb-3 flex items-center gap-2 text-2xl font-bold">
						<Users size={20} /> Positions
					</div>
					<div class="flex flex-wrap gap-2">
						{#each positions as [position, count]}
							<div class="border border-zinc-700 bg-zinc-950/60 px-3 py-2">
								<span class="font-bold">{position}</span>
								<span class="text-zinc-300"> x{count}</span>
							</div>
						{/each}
					</div>
				</section>
			</div>
		</div>
	{/if}
</div>
