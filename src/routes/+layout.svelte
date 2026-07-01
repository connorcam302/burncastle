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

<div class="flex min-h-svh min-w-0 items-start justify-center px-3 py-4 sm:px-5 md:py-8">
	<div class="min-w-0 w-full">
		<div
			class="mx-auto flex h-full min-w-0 max-w-6xl flex-col items-center justify-center gap-4 uppercase md:gap-8"
		>
			<div class="mr-auto flex min-w-0 items-center gap-2">
				<img src="/logo.png" alt="logo" class="h-14 w-14 shrink-0 md:h-24 md:w-24" />
				<div class="min-w-0 text-[clamp(1.75rem,8.4vw,4rem)] font-bold leading-none md:text-8xl">
					<span class="text-burnley">BURN</span><span class="text-white">CASTLE</span>
				</div>
			</div>
			<div class="min-w-0 w-full">
				<Navbar />
			</div>
			{@render children?.()}
		</div>
	</div>
</div>
