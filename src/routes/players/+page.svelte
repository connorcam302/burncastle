<script lang="ts">
	import { tick } from 'svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import PlayerView from '$lib/components/PlayerView.svelte';
	import { CircleX, Search } from '@lucide/svelte';
	let players = $derived(useQuery(api.players.getAll, {}));
	let hoveredIndex = $state(-1);

	let playerSearchString = $state('');

	let displayedPlayers = $derived(
		(players.data ?? []).filter((p) =>
			p.name.toLowerCase().includes(playerSearchString.toLowerCase())
		)
	);

	let selectedPlayer = $state<NonNullable<typeof players.data>[number] | undefined>();
	let selectedPlayerSection = $state<HTMLElement>();

	$effect(() => {
		if (!selectedPlayer && players.data) {
			selectedPlayer = players.data.find((player) => player.stats.length > 0);
		}
	});

	const selectHoveredPlayer = () => {
		const player = displayedPlayers[hoveredIndex];
		if (player?.stats.length) {
			selectedPlayer = player;
		}
	};

	const selectPlayer = async (player: NonNullable<typeof players.data>[number]) => {
		if (player.stats.length) {
			selectedPlayer = player;
			await tick();
			selectedPlayerSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};
</script>

<div class="flex w-full flex-col justify-center gap-4">
	<div
		class="mx-auto flex w-full max-w-sm items-center gap-2 bg-gradient-to-r from-[#0a0e13] to-[#1e2c3a] px-3 py-1 text-white md:mx-0"
	>
		<Search class="w-6 h-6 text-white" />
		<input
			type="text"
			bind:value={playerSearchString}
			class="min-h-11 min-w-0 flex-1 border-0 bg-transparent text-lg font-bold uppercase outline-none ring-0 focus:outline-none sm:text-xl"
			placeholder="Search..."
		/>
		<button onclick={() => (playerSearchString = '')} class="w-6 h-6 text-white cursor-pointer"
			><CircleX /></button
		>
	</div>

	{#if selectedPlayer && selectedPlayer.stats.length > 0}
		<div bind:this={selectedPlayerSection}>
			<PlayerView player={selectedPlayer} stats={selectedPlayer.stats} />
		</div>
	{/if}

	{#if !players.isLoading && players.data !== undefined}
		<button
			aria-hidden="true"
			class="card-row justify-center items-center h-64 w-full overflow-hidden hidden md:flex"
			onmouseleave={() => (hoveredIndex = -1)}
			onclick={selectHoveredPlayer}
		>
			{#each displayedPlayers as player, index (player._id)}
				{#if player.stats.length > 0}
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
				{/if}
			{/each}
		</button>
		<div class="grid grid-cols-2 items-start justify-items-center gap-2 md:hidden">
			{#each displayedPlayers as player (player._id)}
				{#if player.stats.length > 0}
					<button
						type="button"
						class="rounded-lg p-1 transition {selectedPlayer?._id === player._id
							? 'bg-highlight/20 ring-2 ring-highlight'
							: 'ring-1 ring-white/10'}"
						aria-label={`Show ${player.name}`}
						aria-pressed={selectedPlayer?._id === player._id}
						onclick={() => selectPlayer(player)}
					>
						<PlayerCard {player} stats={player.stats[0]} />
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
