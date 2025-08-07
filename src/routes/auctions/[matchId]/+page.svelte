<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';

	let { data } = $props();

	let { matchId } = data;

	let auction = $derived(useQuery(api.auctions.get, { matchId }));

	$inspect(auction);
</script>

{matchId}
