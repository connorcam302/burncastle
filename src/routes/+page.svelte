<script>
	import ClickableTileWithImage from '$lib/components/ClickableTileWithImage.svelte';

	const matchesPlayed = 3;

	const auctionText = 'Next auction at 19:00 August 8th';
</script>

<div class="max-w-6xl mx-auto grow w-full">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
		<ClickableTileWithImage
			image="https://imgresizer.tntsports.io/unsafe/2560x1440/filters:format(jpeg)/origin-imgresizer.tntsports.io/2025/03/11/image-2c33751b-72bd-4b98-9cc2-8873bbd18247-85-2560-1440.jpeg"
			title="MATCHES"
			onClick={() => alert('clicked')}
			class="w-full h-80"
		>
			<div class="flex flex-col items-stretch h-full">
				<div>See historic burncastle matches</div>
				<div class="grow"></div>
				<div>
					{matchesPlayed} matches played
				</div>
			</div>
		</ClickableTileWithImage>

		<ClickableTileWithImage
			image="https://imgresizer.tntsports.io/unsafe/2560x1440/filters:format(jpeg)/origin-imgresizer.tntsports.io/2025/03/11/image-2c33751b-72bd-4b98-9cc2-8873bbd18247-85-2560-1440.jpeg"
			title="AUCTIONS"
			onClick={() => alert('clicked')}
			class="w-full h-80"
		>
			<div class="flex flex-col items-stretch h-full">
				<div class="capitalize"></div>
				<div class="grow"></div>
				<div>{auctionText}</div>
			</div>
		</ClickableTileWithImage>
		<ClickableTileWithImage
			image="https://imgresizer.tntsports.io/unsafe/2560x1440/filters:format(jpeg)/origin-imgresizer.tntsports.io/2025/03/11/image-2c33751b-72bd-4b98-9cc2-8873bbd18247-85-2560-1440.jpeg"
			title="PLAYERS"
			onClick={() => alert('clicked')}
			class="w-full"
		>
			See all player stats
		</ClickableTileWithImage>

		<ClickableTileWithImage
			image="https://imgresizer.tntsports.io/unsafe/2560x1440/filters:format(jpeg)/origin-imgresizer.tntsports.io/2025/03/11/image-2c33751b-72bd-4b98-9cc2-8873bbd18247-85-2560-1440.jpeg"
			title="GALLERY"
			onClick={() => alert('clicked')}
			class="w-full"
		>
			See images from the burncastle gallery
		</ClickableTileWithImage>
	</div>
</div>
