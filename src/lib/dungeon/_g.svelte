<script lang="ts">
	import Settings from './Settings.svelte'
	import Inventory from './Inventory.svelte'
	import { onMount } from 'svelte'
	import * as ROT from 'rot-js'
	import { TILE, TILE_DEFS, type TileId } from './tiles'
	import { type Item, randomItem } from './items'
	let actionLog = $state<string[]>([])
	let {
		VIEW_WIDTH = 18,
		VIEW_HEIGHT = 12,
		MAP_WIDTH = 50,
		MAP_HEIGHT = 30,
		TILE_SIZE = 40
	} = $props()

	const createGrid = <T,>(fill: T) =>
		Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(fill))

	let player = $state({ x: 0, y: 0 })
	let inventory = $state<Item[]>([])
	let map = $state(createGrid<TileId>(TILE.WALL))
	let items = $state(createGrid<Item | null>(null))
	let explored = $state(createGrid(false))
	let visible = $state(createGrid(false))

	let display: ROT.Display
	let mounted = $state(false)

	function useItem(item: Item) {
		const idx = inventory.indexOf(item)
		if (idx === -1) return
		inventory.splice(idx, 1)
		actionLog = [`Benutzt: ${item.name}`, ...actionLog].slice(0, 10)
		// Hier später: HP heilen, Buff anwenden etc.
	}

	function dropItem(item: Item) {
		const idx = inventory.indexOf(item)
		if (idx === -1) return
		// Item zurück auf den Boden legen
		items[player.y][player.x] = item
		inventory.splice(idx, 1)
		actionLog = [`Weggeworfen: ${item.name}`, ...actionLog].slice(0, 10)
	}

	function generateMap() {
		let startSet = false
		const digger = new ROT.Map.Digger(MAP_WIDTH, MAP_HEIGHT)
		digger.create((x, y, value) => {
			map[y][x] = value
			if (!startSet && value === 0) {
				player.x = x
				player.y = y
				startSet = true
			}
		})

		digger.getRooms().forEach((room) => {
			room.getDoors((x, y) => (map[y][x] = TILE.DOOR_CLOSED))
			if (Math.random() < 0.3) {
				const ix = ROT.RNG.getUniformInt(room.getLeft(), room.getRight())
				const iy = ROT.RNG.getUniformInt(room.getTop(), room.getBottom())
				if (!items[iy][ix]) items[iy][ix] = randomItem() // ← kommt jetzt aus items.ts
			}
		})
	}

	function updateFOV() {
		const fov = new ROT.FOV.PreciseShadowcasting((x, y) => {
			if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false
			return TILE_DEFS[map[y][x]]?.lightPass ?? false
		})
		for (let y = 0; y < MAP_HEIGHT; y++) visible[y].fill(false)
		fov.compute(player.x, player.y, 10, (x, y) => {
			if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
				visible[y][x] = true
				explored[y][x] = true
			}
		})
	}

	function draw() {
		display.clear()
		const offsetX = Math.max(
			0,
			Math.min(player.x - Math.floor(VIEW_WIDTH / 2), MAP_WIDTH - VIEW_WIDTH)
		)
		const offsetY = Math.max(
			0,
			Math.min(player.y - Math.floor(VIEW_HEIGHT / 2), MAP_HEIGHT - VIEW_HEIGHT)
		)

		for (let y = 0; y < VIEW_HEIGHT; y++) {
			for (let x = 0; x < VIEW_WIDTH; x++) {
				const mx = x + offsetX
				const my = y + offsetY
				if (!visible[my][mx] && !explored[my][mx]) continue

				const tileId = map[my][mx]
				const isVisible = visible[my][mx]
				let { style, char } = TILE_DEFS[tileId]
				let color = isVisible ? style.fg : '#333'

				const item = items[my][mx]
				if (item && isVisible) {
					char = item.char
					color = item.color
				}

				display.draw(x, y, char, color)
			}
		}
		display.draw(player.x - offsetX, player.y - offsetY, '@', 'yellow', 'blue')
	}

	function handleInput(e: KeyboardEvent) {
		const move: Record<string, [number, number]> = {
			ArrowUp: [0, -1],
			ArrowDown: [0, 1],
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0]
		}

		if (move[e.key]) {
			const [dx, dy] = move[e.key]
			const nx = player.x + dx
			const ny = player.y + dy
			const target = map[ny]?.[nx]
			if (target !== undefined && TILE_DEFS[target].walkable) {
				player.x = nx
				player.y = ny
			} else if (target === TILE.DOOR_CLOSED) {
				map[ny][nx] = TILE.DOOR_OPEN
			}
		} else if (e.key === 'g') {
			const item = items[player.y][player.x]
			if (item) {
				inventory.push(item)
				items[player.y][player.x] = null
			}
		}

		reDraw()
	}

	const reDraw = () => {
		if (!mounted) return
		updateFOV()
		draw()
	}

	onMount(() => {
		display = new ROT.Display({
			width: VIEW_WIDTH,
			height: VIEW_HEIGHT,
			fontSize: TILE_SIZE,
			forceSquareRatio: true
		})
		document
			.getElementById('game-container')
			?.appendChild(display.getContainer()!)
		generateMap()
		mounted = true

		inventory.push(randomItem())
		inventory.push(randomItem())
		inventory.push(randomItem())
		inventory.push(randomItem())

		reDraw()

		window.addEventListener('keydown', handleInput)
		return () => window.removeEventListener('keydown', handleInput)
	})
</script>

<section class="page page-fixed nwp center">
	<div>
		<div id="game-container"></div>
	</div>
</section>
<aside class="aside bg-base-300">
	<div class="padded space-y-2">
		<Inventory {inventory} onUse={useItem} onDrop={dropItem} />
		<Settings></Settings>
		<div></div>
	</div>
</aside>

<style>
	#game-container {
		background: black;
		border: 2px solid #333;
	}
</style>
