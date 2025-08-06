<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import PlayerCard from '$lib/components/PlayerCard.svelte';

	let players = $derived(useQuery(api.players.getAll, {}));

	$inspect(players);
</script>

{#if !players.isLoading && players.data !== undefined}
	<div class="flex gap-1 flex-wrap">
		{#each players.data as player (player._id)}
			<PlayerCard {player} />
		{/each}
	</div>
{/if}
