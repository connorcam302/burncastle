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
		'group relative min-h-52 overflow-hidden border-2 border-[#2b3b4f] text-zinc-300 transition-colors duration-400 hover:cursor-pointer hover:border-sky-800 hover:text-white sm:min-h-64'
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
	<div class="relative flex h-full w-full flex-col gap-2 p-4 text-left sm:p-5">
		<div
			class="text-[clamp(2.25rem,12vw,3.75rem)] font-bold leading-none text-white capitalize transition-colors duration-300 group-hover:text-highlight"
		>
			{title}
		</div>
		<div class="w-2/3 h-0.5 bg-zinc-900 opacity-80"></div>
		{@render children()}
	</div>
</button>
