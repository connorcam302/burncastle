<script lang="ts">
	import type { FunctionReturnType } from 'convex/server';
	import { api } from '../../convex/_generated/api';

	type Auction = FunctionReturnType<typeof api.auctions.getAll>[number];

	let { match }: { match: Auction } = $props();

	function readableTextColour(background?: string) {
		if (!background) return '#f8fafc';
		const hex = background.replace('#', '');
		const fullHex =
			hex.length === 3
				? hex
						.split('')
						.map((char) => char + char)
						.join('')
				: hex;
		const value = Number.parseInt(fullHex, 16);
		if (Number.isNaN(value)) return '#f8fafc';

		const red = (value >> 16) & 255;
		const green = (value >> 8) & 255;
		const blue = value & 255;
		const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

		return luminance > 150 ? '#111827' : '#f8fafc';
	}
</script>

<div
	class="mx-auto flex w-full items-center gap-2 bg-gradient-to-r from-[#0a0e13]/95 to-[#1e2c3a]/95 p-2 text-white md:mx-0"
>
	<div class="flex w-full flex-col items-center gap-3 p-2 md:gap-4">
		<div class="text-2xl font-bold text-white md:text-3xl">Burncastle {match.order}</div>
		<div class="text-white flex w-full">
			<!-- Left team section - fixed width -->
			<div class="flex gap-4 items-center md:w-1/3 w-1/4">
				<img
					src={`/players/${match.teams[0].captain?.nameId}.png`}
					alt={match.teams[0].name}
					class="md:w-24 md:h-24 w-16 h-16"
				/>
				<div class="font-medium text-4xl truncate md:block hidden">
					{match.teams[0].name}
				</div>
			</div>

			<div class="flex w-1/2 items-center justify-center gap-2 md:w-1/3 md:gap-4">
				<div
					class="flex h-16 w-16 items-center justify-center md:h-24 md:w-24"
					style="background-color: {match.teams[0].teamColour}; color: {readableTextColour(
						match.teams[0].teamColour
					)};"
				>
					<div class="text-4xl md:text-6xl">{match.teams[0].score}</div>
				</div>
				<div class="text-4xl md:text-6xl">-</div>
				<div
					class="flex h-16 w-16 items-center justify-center md:h-24 md:w-24"
					style="background-color: {match.teams[1].teamColour}; color: {readableTextColour(
						match.teams[1].teamColour
					)};"
				>
					<div class="text-4xl md:text-6xl">{match.teams[1].score}</div>
				</div>
			</div>

			<div class="flex gap-4 items-center justify-end md:w-1/3 w-1/4">
				<div class="text-right font-medium text-4xl truncate md:block hidden">
					{match.teams[1].name}
				</div>
				<img
					src={`/players/${match.teams[1].captain?.nameId}.png`}
					alt={match.teams[1].name}
					class="md:w-24 md:h-24 w-16 h-16"
				/>
			</div>
		</div>
	</div>
</div>
