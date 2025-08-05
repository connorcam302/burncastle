<script lang="ts">
	let active = 'HOME';
	const menuItems = ['HOME', 'MATCHES', 'AUCTIONS', 'PLAYERS', 'GALLERY'];

	function setActive(item) {
		active = item;
	}
</script>

<nav
	class="flex h-10 items-stretch bg-gradient-to-r from-[#0a0e13] to-[#1e2c3a] border-b-2 border-[#1b2733] select-none overflow-hidden font-sans w-full text-xl"
>
	{#each menuItems as item, i (i)}
		<button
			class="relative flex items-stretch cursor-pointer group -left-2"
			on:click={() => setActive(item)}
		>
			<!-- Diagonal divider (skip for last item) -->
			{#if i !== menuItems.length - 1}
				<div class="absolute right-0 top-2 h-6 w-px bg-[#2b3b4f] skew-x-[25deg] z-20"></div>
			{/if}

			<!-- Skewed background -->
			{#if active === item}
				<div
					class={`h-full flex items-center px-6 skew-x-[25deg] transition-all duration-300 border-2 border-transparent
					${
						active === item
							? 'bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-[rgba(255,255,255,0.05)] shadow-inner shadow-[0_0_4px_rgba(255,215,0,0.3)] border-2 border-[rgba(255,215,0,0.1)]'
							: ''
					}`}
				>
					<!-- Unskewed text -->
					<span
						class="skew-x-[-25deg] text-xl uppercase whitespace-nowrap transition-colors duration-300 text-[#ffd700] font-bold"
					>
						{item}
					</span>
				</div>
			{:else}
				<div
					class="h-full flex items-center px-6 skew-x-[25deg] transition-all duration-300 border-2 border-transparent"
				>
					<!-- Unskewed text -->
					<span
						class="skew-x-[-25deg] uppercase whitespace-nowrap transition-colors duration-300 text-[#aaa] group-hover:text-white text-xl font-medium"
					>
						{item}
					</span>
				</div>
			{/if}
		</button>
	{/each}
</nav>
