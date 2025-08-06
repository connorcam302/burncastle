<script lang="ts">
	import type { FunctionReturnType } from 'convex/server';
	import { api } from '../../convex/_generated/api';

	type PlayersQueryResult = FunctionReturnType<typeof api.players.getAll>[number];

	let { player }: { player: PlayersQueryResult } = $props();

	let stats;
	if (player?.stats?.breakdown !== undefined) {
		stats = JSON.parse(player.stats.breakdown);
	}
</script>

{#if player}
	<div
		class="bg-gradient-to-bl from-amber-200 via-yellow-400 to-yellow-600 px-4 py-2 rounded-lg w-44"
	>
		<div class="flex justify-between">
			<div class="flex flex-col items-center w-fit">
				<div class="font-medium text-3xl">{player?.stats?.rating ?? 0}</div>
				<div class="text-xl">{player?.stats?.position ?? '??'}</div>
			</div>
			<img src={`/players/${player.nameId}.png`} alt={player.name} class="w-24 h-24" />
		</div>
		<div class="uppercase text-center text-xl font-medium">{player.name}</div>
		<div class="bg-black/15 w-full h-1"></div>
		<div class="flex justify-between">
			<div class="w-full grow flex flex-col items-center">
				{#if stats?.pace !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.pace ?? 0}</div>
						<div>PAC</div>
					</div>
				{:else if stats?.diving !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.diving ?? 0}</div>
						<div>DIV</div>
					</div>
				{/if}
				{#if stats?.shooting !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.shooting ?? 0}</div>
						<div>SHO</div>
					</div>
				{:else if stats?.handling !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.handling ?? 0}</div>
						<div>HAN</div>
					</div>
				{/if}
				{#if stats?.passing !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.passing ?? 0}</div>
						<div>PAS</div>
					</div>
				{:else if stats?.kicking !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.kicking ?? 0}</div>
						<div>KIC</div>
					</div>
				{/if}
			</div>
			<div class="self-stretch py-1">
				<div class="bg-black/15 w-1 h-full"></div>
			</div>
			<div class="w-full grow flex flex-col items-center">
				{#if stats?.dribbling !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.dribbling ?? 0}</div>
						<div>DRI</div>
					</div>
				{:else if stats?.reflexes !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.reflexes ?? 0}</div>
						<div>REF</div>
					</div>
				{/if}
				{#if stats?.defending !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.defending ?? 0}</div>
						<div>DEF</div>
					</div>
				{:else if stats?.speed !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.speed ?? 0}</div>
						<div>SPE</div>
					</div>
				{/if}
				{#if stats?.physical !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.physical ?? 0}</div>
						<div>PHY</div>
					</div>
				{:else if stats?.positioning !== undefined}
					<div class="flex gap-2 items-center font-medium">
						<div>{stats?.positioning ?? 0}</div>
						<div>POS</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
