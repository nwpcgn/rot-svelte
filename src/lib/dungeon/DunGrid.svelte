<script lang="ts">
	import { onMount } from 'svelte'
	import {
		createMap,
		type Room,
		type Position,
		type MapResult
	} from './createMap'
	import Game from './Game.svelte'
	let options = $state({
		mw: 60,
		mh: 40,
		vh: 12,
		vw: 16,
		tz: 32
	})

	onMount(() => {
		//	const { map, rooms, start, exit } = createMap(50, 30)
		// console.log(start, exit)
		// console.log(rooms)
	})
</script>

<Game></Game>
