<script lang="ts">
	import { page } from '$app/state';

	const menuItems = ['', 'matches', 'auctions', 'players', 'gallery'];
</script>

<nav
	class="flex min-h-12 min-w-0 max-w-full items-stretch overflow-x-auto overflow-y-hidden bg-gradient-to-r from-[#0a0e13] to-[#1e2c3a] font-sans text-base select-none md:min-h-10 md:overflow-hidden md:text-xl"
	aria-label="Primary navigation"
>
	{#each menuItems as item, i (i)}
		<a
			class="group relative -left-2 flex min-h-12 min-w-max flex-1 cursor-pointer items-stretch md:min-h-10"
			href={`/${item}`}
		>
			<!-- Diagonal divider (skip for last item) -->
			{#if i !== menuItems.length - 1}
				<div class="absolute right-0 top-2 h-6 w-px bg-[#2b3b4f] skew-x-[25deg] z-20"></div>
			{/if}

			<!-- Skewed background -->
			{#if page.url.pathname === `/${item}`}
				<div
					class={`h-full flex items-center px-6 skew-x-[25deg] transition-all duration-300 
					bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-[rgba(255,255,255,0.05)] shadow-[0_0_4px_rgba(255,215,0,0.3)] border-2 border-[rgba(255,215,0,0.1)]
					`}
				>
					<!-- Unskewed text -->
					<span
						class="skew-x-[-25deg] whitespace-nowrap text-base font-bold uppercase text-[#ffd700] transition-colors duration-300 md:text-xl"
					>
						{#if item === ''}
							Home
						{:else}
							{item}
						{/if}
					</span>
				</div>
			{:else}
				<div
					class="flex h-full items-center border-2 border-transparent px-5 skew-x-[25deg] transition-all duration-300 md:px-6"
				>
					<!-- Unskewed text -->
					<span
						class="skew-x-[-25deg] whitespace-nowrap text-base font-medium uppercase text-[#aaa] transition-colors duration-300 group-hover:text-white md:text-xl"
					>
						{#if item === ''}
							Home
						{:else}
							{item}
						{/if}
					</span>
				</div>
			{/if}
		</a>
	{/each}
</nav>

<style>
</style>
