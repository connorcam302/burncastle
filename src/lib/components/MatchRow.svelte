<script lang="ts">
	import type { FunctionReturnType } from 'convex/server';
	import { api } from '../../convex/_generated/api';

	type Auction = FunctionReturnType<typeof api.auctions.getAll>[number];

	let { match }: { match: Auction } = $props();
</script>

<div
	class="flex gap-2 bg-gradient-to-r from-[#0a0e13] border-0 to-[#1e2c3a] items-center text-white mx-auto md:mx-0 w-full"
>
	<div class="flex gap-4 items-center flex-col w-full pt-2">
		<div class="text-white text-3xl font-bold">Burncastle {match.order}</div>
		<div class="text-white flex w-full">
			<!-- Left team section - fixed width -->
			<div class="flex gap-2 items-center md:w-1/3 w-1/4">
				<img
					src={`/players/${match.teams[0].captain?.nameId}.png`}
					alt={match.teams[0].name}
					class="md:w-24 md:h-24 w-16 h-16"
				/>
				<div class="font-medium text-4xl truncate md:block hidden">
					{match.teams[0].name}
				</div>
			</div>

			<!-- Center score section - fixed width -->
			<div class="flex gap-2 items-center justify-center md:w-1/3 w-1/2">
				<div
					class="flex md:w-24 md:h-24 w-16 h-full justify-center items-center"
					style="background-color: {match.teams[0].teamColour};"
				>
					<div class="text-4xl md:text-6xl">{match.teams[0].score}</div>
				</div>
				<div class="text-4xl md:text-6xl">-</div>
				<div
					class="flex md:w-24 md:h-24 w-16 h-full justify-center items-center"
					style="background-color: {match.teams[1].teamColour};"
				>
					<div class="text-4xl md:text-6xl">{match.teams[1].score}</div>
				</div>
			</div>

			<!-- Right team section - fixed width -->
			<div class="flex gap-2 items-center justify-end md:w-1/3 w-1/4">
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
