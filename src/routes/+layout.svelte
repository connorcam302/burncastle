<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/Navbar.svelte';
	import { setupConvex } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';

	setupConvex(PUBLIC_CONVEX_URL);

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex items-center justify-center my-8">
	<div class="h-full w-full">
		<div class="flex flex-col items-center justify-center gap-8 max-w-6xl mx-auto h-full">
			<div class="flex gap-2 mr-auto items-center">
				<img src="/logo.png" alt="logo" class="md:w-24 md:h-24 w-16 h-16" />
				<div class="font-bold text-4xl md:text-8xl">
					<span class="text-burnley">BURN</span><span class="text-white">CASTLE</span>
				</div>
			</div>
			<div class="hidden md:block md:w-full">
				<Navbar />
			</div>
			{@render children?.()}
		</div>
	</div>
</div>
