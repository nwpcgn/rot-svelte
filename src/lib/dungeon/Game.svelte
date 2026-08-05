<script lang="ts">
	import { slide } from 'svelte/transition'
	import Preview from './Preview.svelte'
	import './css/_game.css'

	import { isDebugging } from './options'
	import { onMount } from 'svelte'
	import * as ROT from 'rot-js'
	import { TILE, TILE_DEFS, type TileId } from './tiles'
	import { randomItem, useItem as applyItem, type Item } from './items'
	import { isAlive, takeDamage, distanceTo } from './actor'
	import { spawnEnemies, allEnemiesTurn, type Enemy } from './enemies'
	import type { Player, Room, Position } from './types'
	import Inventory from './Inventory.svelte'
	import GameOver from './GameOver.svelte'
	import { parseNumber } from '$lib'
	let {
		VIEW_WIDTH = 16,
		VIEW_HEIGHT = 12,
		MAP_WIDTH = 60,
		MAP_HEIGHT = 40,
		TILE_SIZE = 42,
		options = {
			mw: 60,
			mh: 40,
			vh: 12,
			vw: 16,
			tz: 32
		}
	} = $props()

	function hpPct(f) {
		return Math.round((f.hp / f.maxHp) * 100)
	}

	const createGrid = <T,>(fill: T) =>
		Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(fill))

	// ─── State ─────────────────────────────────────────────────
	let gameOver = $derived(!isAlive(player))
	let player = $state<Player>({
		id: 1,
		name: 'Aldo Ray',
		char: '@',
		color: 'yellow',
		pos: { x: 0, y: 0 },
		stats: { hp: 88, maxHp: 90, atk: 5, def: 2 },
		inventory: []
	})

	let roomList: Room[] = $state([])
	let exit: Position = $state({ x: 0, y: 0 })

	let enemies = $state<Enemy[]>([])
	let items = $state(createGrid<Item | null>(null))
	let map = $state(createGrid<TileId>(TILE.WALL))
	let explored = createGrid(false)
	let visible = createGrid(false)
	let log = $state<string[]>(['Willkommen im Dungeon!'])
	let mounted = $state(false)

	let itemsOnMap = $derived(
		items?.flat().reduce((accumulator, currentValue) => {
			if (currentValue) {
				accumulator++
			}

			return accumulator
		}, 0)
	)

	let display: ROT.Display
	/* --------------------------------- Logger --------------------------------- */
	function addLog(msg: string) {
		log = [msg, ...log].slice(0, 20)
	}

	function getZeroLogs(maxi = 5) {
		return Array.from({ length: Math.max(0, maxi - log.length) }, () => 1)
	}
	// ─── Map generieren ────────────────────────────────────────
	function generateMap() {
		let startSet = false
		const digger = new ROT.Map.Digger(MAP_WIDTH, MAP_HEIGHT)
		digger.create((x, y, value) => {
			map[y][x] = value
			// if (!startSet && value === 0) {
			// 	player.pos.x = x
			// 	player.pos.y = y
			// 	startSet = true
			// }
		})

		const rooms = digger.getRooms()
		console.log('rooms', rooms.length)
		rooms.forEach((room, id) => {
			room.getDoors((x, y) => (map[y][x] = TILE.DOOR_CLOSED))
			if (Math.random() < 0.4) {
				const ix = ROT.RNG.getUniformInt(room.getLeft(), room.getRight())
				const iy = ROT.RNG.getUniformInt(room.getTop(), room.getBottom())
				if (!items[iy][ix]) items[iy][ix] = randomItem()
			}
		})

		roomList = rooms.map((room, i) => ({
			id: i,
			x: room.getLeft(),
			y: room.getTop(),
			width: room.getRight() - room.getLeft() + 1,
			height: room.getBottom() - room.getTop() + 1,
			center: { x: room.getCenter()[0], y: room.getCenter()[1] }
		}))

		// 🟢 Start
		const startRoom = rooms[0]
		const [startX, startY] = startRoom.getCenter()
		const start: Position = { x: startX, y: startY }

		// 🚪 Exit (weitester Raum)
		function distance(a: [number, number], b: [number, number]) {
			return Math.hypot(a[0] - b[0], a[1] - b[1])
		}

		let exitRoom = rooms[0]
		let maxDist = 0

		for (const room of rooms) {
			const center = room.getCenter()
			const dist = distance(center, [startX, startY])

			if (dist > maxDist) {
				maxDist = dist
				exitRoom = room
			}
		}

		const [exitX, exitY] = exitRoom.getCenter()
		exit = { x: exitX, y: exitY }

		// 🪜 Stairs setzen
		map[exitY][exitX] = TILE.STAIRS
		player.pos = start
		startSet = true
		enemies = spawnEnemies(rooms, map)

		console.log(roomList)
	}

	// ─── FOV ───────────────────────────────────────────────────
	function updateFOV() {
		const fov = new ROT.FOV.PreciseShadowcasting((x, y) => {
			if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false
			return TILE_DEFS[map[y][x]]?.lightPass ?? false
		})
		for (let y = 0; y < MAP_HEIGHT; y++) visible[y].fill(false)
		fov.compute(player.pos.x, player.pos.y, 10, (x, y) => {
			if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
				visible[y][x] = true
				explored[y][x] = true
			}
		})
	}

	// ─── Rendering ─────────────────────────────────────────────
	function draw() {
		display.clear()
		const ox = Math.max(
			0,
			Math.min(
				player.pos.x - Math.floor(VIEW_WIDTH / 2),
				MAP_WIDTH - VIEW_WIDTH
			)
		)
		const oy = Math.max(
			0,
			Math.min(
				player.pos.y - Math.floor(VIEW_HEIGHT / 2),
				MAP_HEIGHT - VIEW_HEIGHT
			)
		)

		for (let y = 0; y < VIEW_HEIGHT; y++) {
			for (let x = 0; x < VIEW_WIDTH; x++) {
				const mx = x + ox,
					my = y + oy
				if (!visible[my][mx] && !explored[my][mx]) continue

				const isVis = visible[my][mx]
				let { style, char } = TILE_DEFS[map[my][mx]]
				let fg = isVis ? style.fg : '#333'

				const item = items[my][mx]
				if (item && isVis) {
					char = item.char
					fg = item.color
				}

				display.draw(x, y, char, fg)
			}
		}

		// Enemies zeichnen (nur wenn sichtbar)
		for (const enemy of enemies) {
			if (!isAlive(enemy)) continue
			if (!visible[enemy.pos.y]?.[enemy.pos.x]) continue
			display.draw(enemy.pos.x - ox, enemy.pos.y - oy, enemy.char, enemy.color)
		}

		// Spieler immer oben drauf
		display.draw(player.pos.x - ox, player.pos.y - oy, '@', 'yellow', 'blue')
	}

	$effect(() => {
		if (!mounted) return

		updateFOV(player.pos)
		draw(player.pos)
	})

	// ─── Input & Spielzug ──────────────────────────────────────
	function handleInput(e: KeyboardEvent) {
		if (!isAlive(player)) return

		const MOVES: Record<string, [number, number]> = {
			ArrowUp: [0, -1],
			ArrowDown: [0, 1],
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0]
		}

		if (MOVES[e.key]) {
			const [dx, dy] = MOVES[e.key]
			const nx = player.pos.x + dx
			const ny = player.pos.y + dy
			const target = map[ny]?.[nx]
			if (target === undefined) return

			// Enemy auf dem Ziel-Tile? → Angriff
			const enemyOnTile = enemies.find(
				(en) => isAlive(en) && en.pos.x === nx && en.pos.y === ny
			)

			if (enemyOnTile && isDebugging) {
				console.log('VOR Angriff:', JSON.stringify(enemyOnTile.stats))
				const dmg = takeDamage(enemyOnTile, player.stats.atk)
				console.log(
					'NACH Angriff:',
					JSON.stringify(enemyOnTile.stats),
					'dmg:',
					dmg
				)
				console.log('isAlive:', isAlive(enemyOnTile))
			}

			if (enemyOnTile) {
				const dmg = takeDamage(enemyOnTile, player.stats.atk)
				addLog(`Du triffst ${enemyOnTile.name} für ${dmg} Schaden.`)
				if (!isAlive(enemyOnTile)) {
					addLog(`${enemyOnTile.name} wurde besiegt! (+${enemyOnTile.xp} XP)`)
				}
			} else if (TILE_DEFS[target].walkable) {
				player.pos.x = nx
				player.pos.y = ny

				if (target === TILE.STAIRS) {
					console.log('Stairs')
					addLog('Stairs')
					resetMap()
					generateMap()
					updateFOV()
					draw()
				}
			} else if (target === TILE.DOOR_CLOSED) {
				map[ny][nx] = TILE.DOOR_OPEN
				addLog('Tür geöffnet.')
			}

			// Item aufheben
			const item = items[player.pos.y][player.pos.x]
			if (item) {
				player.inventory.push(item)
				items[player.pos.y][player.pos.x] = null
				addLog(`${item.char} ${item.name} aufgehoben.`)
			}

			// Enemies sind dran
			// allEnemiesTurn(enemies, player, map, addLog)
			enemies = allEnemiesTurn(enemies, player, map, addLog).filter(isAlive)
			// Tote Enemies entfernen
			enemies = enemies.filter(isAlive)
		} else if (e.key === 'g') {
			// Manuelles Aufheben mit 'g'
			const item = items[player.pos.y][player.pos.x]
			if (item) {
				player.inventory.push(item)
				items[player.pos.y][player.pos.x] = null
				addLog(`${item.name} aufgehoben.`)
			}
		}

		updateFOV()
		draw()
	}

	// ─── Inventory-Callbacks ───────────────────────────────────
	function onUseItem(item: Item) {
		const msg = applyItem(item, player)
		const idx = player.inventory.indexOf(item)
		if (idx !== -1) player.inventory.splice(idx, 1)
		addLog(msg)
	}

	function onDropItem(item: Item) {
		items[player.pos.y][player.pos.x] = item
		const idx = player.inventory.indexOf(item)
		if (idx !== -1) player.inventory.splice(idx, 1)
		addLog(`${item.name} weggeworfen.`)
	}

	/* ------------------------------- Reset Game ------------------------------- */
	function resetMap() {
		// Grids neu erstellen
		map = createGrid<TileId>(TILE.WALL)
		items = createGrid<Item | null>(null)
		explored = createGrid(false)
		visible = createGrid(false)
		enemies = []
		roomList = []
		exit = { x: 0, y: 0 }
	}
	// Reset: alles auf Anfang
	function resetGame() {
		// Stats zurücksetzen
		player.stats.hp = player.stats.maxHp
		player.pos.x = 0
		player.pos.y = 0
		player.inventory = [randomItem(), randomItem(), randomItem()]

		resetMap()

		log = ['Neues Spiel gestartet.']

		// Map neu generieren — $effect zeichnet automatisch neu
		generateMap()
		addLog(`Items: ${itemsOnMap} Enemies: ${enemies.length}`)
		updateFOV()
		draw()
	}

	// ─── Mount ─────────────────────────────────────────────────
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
		resetGame()
		mounted = true

		// updateFOV()
		// draw()

		window.addEventListener('keydown', handleInput)
		return () => window.removeEventListener('keydown', handleInput)
	})

	// $inspect(player.stats.hp)
</script>

{#snippet inventoryT()}
	<div class="w-[300px]">
		<Inventory
			inventory={player.inventory}
			onUse={onUseItem}
			onDrop={onDropItem} />
	</div>
{/snippet}
{#snippet dungeonT()}
	<div class="list">
		<div class="list-row">
			<span class="list-col-grow">MW</span>
			<span>{MAP_WIDTH}</span>
		</div>
		<div class="list-row">
			<span class="list-col-grow">MH</span>
			<span>{MAP_HEIGHT}</span>
		</div>
		<div class="list-row">
			<span class="list-col-grow">TZ</span>
			<span>{TILE_SIZE}</span>
		</div>
		<div class="list-row">
			<div class="list-col-grow grid grid-cols-2 gap-2">
				<button
					onclick={resetGame}
					class="btn"
					popovertarget="pe-map"
					popovertargetaction="hide">New</button>
				<button
					class="btn btn-primary"
					popovertarget="pe-map"
					popovertargetaction="hide">Options</button>
			</div>
		</div>
	</div>
{/snippet}
{#snippet heroT()}
	<div class="list">
		<div class="list-row">
			<span class="list-col-grow">Fighter</span>
			<span>{player.name}</span>
		</div>
		<div class="list-row">
			<span class="list-col-grow">HP/Max</span>
			<span>{player.stats.hp}/{player.stats.maxHp}</span>
		</div>
		<div class="list-row">
			<span class="list-col-grow">AT/DE</span>
			<span>{player?.stats?.atk}/{player?.stats?.def}</span>
		</div>
		<div class="list-row">
			<span class="list-col-grow">Position</span>
			<span>{player?.pos?.x}/{player?.pos?.y}</span>
		</div>
	</div>
{/snippet}
<section class="page page-fixed nwp">
	<article>
		<!-- HP-Anzeige über dem Spielfeld -->

		<div>Items: {itemsOnMap} Enemies: {enemies.length}</div>
	</article>

	<div class="grid flex-1 place-content-center">
		<div style="position: relative">
			<div id="game-container"></div>
			{#if gameOver}
				<GameOver onReset={resetGame} />
			{/if}
		</div>
	</div>
	<div class="log divide-y divide-base-300 border-t border-base-300">
		{#each log.slice(0, 5) as entry, i}
			<div class="px-2 py-1">
				<div style="opacity: {1 - i * 0.18}">{entry}</div>
			</div>
		{/each}
		{#each getZeroLogs(5) as entry, id (id)}
			<div class="px-2 py-1">
				<div style="opacity: 0;">{entry}</div>
			</div>
		{/each}
	</div>
</section>
<div class="page nwp translate-y-full">
	<div class=" mx-auto mt-12 w-[300px] bg-white">
		{@render inventoryT()}
	</div>
</div>
<aside class="aside bg-base-300">
	<div>
		<Preview {exit} {map} {explored} {player}></Preview>
	</div>

	<!-- buttons -->
	<div class="space-y-2">
		<details
			class="collapse border border-base-300 bg-base-100"
			name="my-accordion-det-1">
			<summary class="collapse-title font-semibold">Map</summary>
			<div class="collapse-content p-0">
				{@render dungeonT()}
			</div>
		</details>
		<details
			class="collapse border border-base-300 bg-base-100"
			name="my-accordion-det-1">
			<summary class="collapse-title font-semibold">Inventar</summary>
			<div class="collapse-content p-0">
				<Inventory
					inventory={player.inventory}
					onUse={onUseItem}
					onDrop={onDropItem} />
			</div>
		</details>
		<details
			class="collapse border border-base-300 bg-base-100"
			name="my-accordion-det-1"
			open>
			<summary class="collapse-title font-semibold">Hero</summary>
			<div class="collapse-content p-0">
				{@render heroT()}
			</div>
		</details>
	</div>
</aside>

<!-- 	<aside class="aside bg-base-300">
	<div class="space-y-1 p-2">
	<div class="split">
			<div>
				<strong>Dungeon</strong>
				<span class="font-light">{MAP_WIDTH}x{MAP_HEIGHT}</span>
			</div>
			<button class="btn btn-primary btn-xs" onclick={resetGame}>New</button>
		</div>

		<Preview {map} {explored} {player}></Preview>

		<div class="split">
			<span>Enemy/ Items</span>
			<span
				>{enemies.length}/{items?.flat().reduce((accumulator, currentValue) => {
					if (currentValue) {
						accumulator++
					}

					return accumulator
				}, 0)}</span>
		</div>
		<div class="split bg-neutral p-2 text-neutral-content">
			<span>Hero</span>
			<span>{player.name}</span>
		</div>

		<div class="split bg-base-200 p-2 text-sm">
			<span class="font-light">A/D</span>
			<span>{player.stats.atk}/{player.stats.def}</span>
		</div>
		<div class="flex items-center gap-2 bg-base-200 p-2">
			<span class="font-light">{player.stats.hp}</span>
			<progress
				class="progress flex-1 transition-all duration-200 ease-in {player.stats
					.hp < 21
					? 'progress-error'
					: 'progress-info'}"
				value={player.stats.hp}
				max={player.stats.maxHp}></progress>
			<span class="font-light">{player.stats.maxHp}</span>
		</div> 

		<Inventory
			inventory={player.inventory}
			onUse={onUseItem}
			onDrop={onDropItem} />

		<div></div>
	</div>
</aside>
-->

<style>
	[popover]:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	[popover] {
		opacity: 0;
		transform: scale(0);
		transition:
			opacity 0.7s,
			transform 0.7s;
	}
	.positionedElement {
		position-area: center bottom;
		margin: unset;
	}

	::backdrop {
		backdrop-filter: blur(3px);
		background-color: rgba(17, 17, 17, 0.86);
	}
</style>
