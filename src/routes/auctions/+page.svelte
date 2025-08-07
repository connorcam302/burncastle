<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api';
	import MatchRow from '$lib/components/MatchRow.svelte';
	let auctions = $derived(useQuery(api.auctions.getAll, {}));
</script>

{#if auctions.data !== undefined && !auctions.isLoading}
	<div class="flex flex-col gap-4 w-full">
		{#each auctions.data as auction (auction._id)}
			<a href="/auctions/{auction._id}">
				<MatchRow match={auction} />
			</a>
		{/each}
	</div>
{/if}
