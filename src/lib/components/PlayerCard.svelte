<script lang="ts">
	import type { FunctionReturnType } from 'convex/server';
	import { api } from '../../convex/_generated/api';
	import type { Doc } from '../../convex/_generated/dataModel';
	import { cn } from '$lib/utils';

	type Player = FunctionReturnType<typeof api.players.getAll>[number];
	type Stats = Doc<'stats'>;

	let { player, stats }: { player: Player; stats: Stats } = $props();

	let statBreakdown;
	if (stats?.breakdown !== undefined) {
		statBreakdown = JSON.parse(stats.breakdown);
	}

	const cardColour = (rating: number) => {
		if (rating >= 65)
			return 'bg-gradient-to-bl from-amber-200 via-yellow-400 to-yellow-600 px-4 py-2 rounded-lg w-44';
		else if (rating >= 60)
			return 'bg-gradient-to-bl from-gray-200 via-gray-300 to-gray-500 px-4 py-2 rounded-lg w-44';
		else
			return 'bg-gradient-to-bl from-orange-300 via-amber-700 to-amber-900 px-4 py-2 rounded-lg w-44';
	};
</script>

{#if player && stats}
	<div class={cn('text-black', cardColour(stats.rating ?? 0))}>
		<div class="flex justify-between">
			<div class="flex flex-col items-center w-fit">
				<div class="font-medium text-3xl">{stats.rating ?? 0}</div>
				<div class="text-xl">{stats?.position ?? '??'}</div>
			</div>
			<img src={`/players/${player.nameId}.png`} alt={player.name} class="w-24 h-24" />
		</div>
		<div class="uppercase text-center text-xl font-medium">
			{player.name}
			{#if stats.isCaptain}(C){/if}
		</div>
		<div class="bg-black/15 w-full h-1"></div>
		<div class="flex justify-between">
			<div class="w-full grow flex flex-col items-center">
				{#if statBreakdown?.pace !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pr-2">
						<div>{statBreakdown?.pace ?? 0}</div>
						<div>PAC</div>
					</div>
				{:else if statBreakdown?.diving !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pr-2">
						<div>{statBreakdown?.diving ?? 0}</div>
						<div>DIV</div>
					</div>
				{/if}
				{#if statBreakdown?.shooting !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pr-2">
						<div>{statBreakdown?.shooting ?? 0}</div>
						<div>SHO</div>
					</div>
				{:else if statBreakdown?.handling !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pr-2">
						<div>{statBreakdown?.handling ?? 0}</div>
						<div>HAN</div>
					</div>
				{/if}
				{#if statBreakdown?.passing !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pr-2">
						<div>{statBreakdown?.passing ?? 0}</div>
						<div>PAS</div>
					</div>
				{:else if statBreakdown?.kicking !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pr-2">
						<div>{statBreakdown?.kicking ?? 0}</div>
						<div>KIC</div>
					</div>
				{/if}
			</div>
			<div class="self-stretch py-1">
				<div class="bg-black/15 w-1 h-full"></div>
			</div>
			<div class="w-full grow flex flex-col items-center justify-between">
				{#if statBreakdown?.dribbling !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pl-2">
						<div>{statBreakdown?.dribbling ?? 0}</div>
						<div>DRI</div>
					</div>
				{:else if statBreakdown?.reflexes !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pl-2">
						<div>{statBreakdown?.reflexes ?? 0}</div>
						<div>REF</div>
					</div>
				{/if}
				{#if statBreakdown?.defending !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pl-2">
						<div>{statBreakdown?.defending ?? 0}</div>
						<div>DEF</div>
					</div>
				{:else if statBreakdown?.speed !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pl-2">
						<div>{statBreakdown?.speed ?? 0}</div>
						<div>SPE</div>
					</div>
				{/if}
				{#if statBreakdown?.physical !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pl-2">
						<div>{statBreakdown?.physical ?? 0}</div>
						<div>PHY</div>
					</div>
				{:else if statBreakdown?.positioning !== undefined}
					<div class="flex gap-2 items-center font-medium text-right w-full justify-between pl-2">
						<div>{statBreakdown?.positioning ?? 0}</div>
						<div>POS</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
