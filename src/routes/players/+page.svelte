<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import PlayerView from '$lib/components/PlayerView.svelte';
	import { CircleX, Search } from '@lucide/svelte';
	let players = $derived(useQuery(api.players.getAll, {}));
	let hoveredIndex = $state(-1);
	$inspect(players);

	let playerSearchString = $state('');

	let displayedPlayers = $derived(
		players?.data?.filter((p) => p.name.toLowerCase().includes(playerSearchString.toLowerCase()))
	);

	let selectedPlayer = $derived(players?.data?.[players?.data?.length - 1]);
</script>

<div class="flex justify-center flex-col gap-4 w-full">
	{#if selectedPlayer}
		<PlayerView player={selectedPlayer} stats={selectedPlayer.stats} />
	{/if}
	<div
		class="flex gap-2 bg-gradient-to-r from-[#0a0e13] border-0 to-[#1e2c3a] w-fit items-center px-2 text-white mx-auto md:mx-0"
	>
		<Search class="w-6 h-6 text-white" />
		<input
			type="text"
			bind:value={playerSearchString}
			class="w-64 uppercase text-xl font-bold bg-transparent border-0 outline-none focus:outline-none ring-0"
			placeholder="Search..."
		/>
		<button onclick={() => (playerSearchString = '')} class="w-6 h-6 text-white cursor-pointer"
			><CircleX /></button
		>
	</div>
	{#if !players.isLoading && players.data !== undefined}
		<button
			aria-hidden="true"
			class="card-row justify-center items-center h-64 w-full overflow-hidden hidden md:flex"
			onmouseleave={() => (hoveredIndex = -1)}
			onclick={() => (selectedPlayer = displayedPlayers[hoveredIndex])}
		>
			{#each displayedPlayers as player, index (player._id)}
				<div
					aria-hidden="true"
					class="card-wrapper relative transition-all duration-300 ease-out cursor-pointer"
					style="
					margin-left: {index === 0 ? '0' : '-120px'};
					transform: translateX({hoveredIndex >= 0
						? index < hoveredIndex
							? -130
							: index > hoveredIndex
								? 130
								: 0
						: 0}px);
					z-index: {hoveredIndex === index ? 999 : 100 + index};
				"
					onmouseenter={() => (hoveredIndex = index)}
				>
					<PlayerCard {player} stats={player.stats[0]} />
				</div>
			{/each}
		</button>
		<button
			class="flex flex-wrap gap-2 md:hidden items-center justify-center"
			onclick={() => (selectedPlayer = displayedPlayers[hoveredIndex])}
		>
			{#each displayedPlayers as player, index (player._id)}
				<div>
					<PlayerCard {player} stats={player.stats[0]} />
				</div>
			{/each}
		</button>
	{/if}
</div>
