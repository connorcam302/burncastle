<script lang="ts">
	import { cn } from '$lib/utils';

	type Props = {
		image: string;
		title: string;
		onClick: () => void;
		children?: any;
		class?: string;
	};

	let { image, title, onClick, children, class: className }: Props = $props();
</script>

<button
	class={cn(
		className,
		'group relative overflow-hidden border-2 border-[#2b3b4f] hover:border-sky-800 hover:cursor-pointer text-zinc-300 hover:text-white transition-colors duration-400'
	)}
	onclick={onClick}
	style="background-image: url('{image}'); background-size: cover; background-position: center;"
>
	<!-- Gradient overlay -->
	<div
		class="absolute inset-0 bg-gradient-to-l from-transparent to-zinc-950 from-10% group-hover:to-sky-800 transition-colors duration-300 z-0"
	></div>

	<div
		class="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950 from-80% group-hover:to-sky-800 transition-colors duration-300 z-0"
	></div>
	<div
		class="absolute inset-0 bg-gradient-to-t from-transparent to-zinc-950 from-80% group-hover:to-sky-800 transition-colors duration-300 z-0"
	></div>

	<!-- Content -->
	<div class="relative p-4 h-full w-full text-left flex flex-col gap-2">
		<div
			class="font-bold text-6xl text-white group-hover:text-burnley transition-colors duration-300 capitalize"
		>
			{title}
		</div>
		<div class="w-2/3 h-0.5 bg-zinc-900 opacity-80"></div>
		{@render children()}
	</div>
</button>
