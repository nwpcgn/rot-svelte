<script lang="ts">
	import './css/_game.css'
	import { isDebugging } from './options'
	import { onMount } from 'svelte'
	import * as ROT from 'rot-js'
	import { renderer } from './renderer'
	import { TILE, TILE_DEFS, type TileId } from '$game/tiles'
	import { randomItem, useItem as applyItem, type Item } from '$game/items'
	import { isAlive, takeDamage, distanceTo } from '$game/actor'
	import { spawnEnemies, allEnemiesTurn, type Enemy } from '$game/enemies'
	import type { Player } from '$game/types'
	import Inventory from '$game/Inventory.svelte'
	import GameOver from '$game/GameOver.svelte'
	import sleep from '../lib/utils/sleep'
	let FRAME = $state({ width: 0, height: 0 })
	let {
		VIEW_WIDTH = 20,
		VIEW_HEIGHT = 12,
		MAP_WIDTH = 50,
		MAP_HEIGHT = 30,
		TILE_SIZE = 32
	} = $props()

	const createGrid = <T,>(fill: T) =>
		Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(fill))

	// ─── State ─────────────────────────────────────────────────
	let gameOver = $derived(!isAlive(player))
	let player = $state<Player>({
		id: 1,
		name: 'Held',
		char: '@',
		color: 'yellow',
		pos: { x: 0, y: 0 },
		stats: { hp: 100, maxHp: 100, atk: 5, def: 2 },
		inventory: []
	})

	let enemies = $state<Enemy[]>([])
	let map = $state(createGrid<TileId>(TILE.WALL))
	let items = $state(createGrid<Item | null>(null))
	// let explored = $state(createGrid(false))
	// let visible = $state(createGrid(false))
	let visible = createGrid(false)
	let explored = createGrid(false)
	let log = $state<string[]>([])
	let mounted = $state(false)

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
			if (!startSet && value === 0) {
				player.pos.x = x
				player.pos.y = y
				startSet = true
			}
		})

		const rooms = digger.getRooms()
		rooms.forEach((room) => {
			room.getDoors((x, y) => (map[y][x] = TILE.DOOR_CLOSED))
			if (Math.random() < 0.3) {
				const ix = ROT.RNG.getUniformInt(room.getLeft(), room.getRight())
				const iy = ROT.RNG.getUniformInt(room.getTop(), room.getBottom())
				if (!items[iy][ix]) items[iy][ix] = randomItem()
			}
		})

		// enemies = spawnEnemies(rooms, map)
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

	// $effect(() => {
	// 	if (!mounted) return

	// 	// updateFOV(player.pos)
	// 	// draw(player.pos)
	// })

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
				// addLog(`Hero @ ${player.pos.x} x ${player.pos.y}`)
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

		// updateFOV()
		// draw()
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

	// Reset: alles auf Anfang
	function resetGame() {
		// Stats zurücksetzen
		player.stats.hp = player.stats.maxHp
		player.pos.x = 0
		player.pos.y = 0
		player.inventory = []

		// Grids neu erstellen
		map = createGrid<TileId>(TILE.WALL)
		items = createGrid<Item | null>(null)
		explored = createGrid(false)
		visible = createGrid(false)
		enemies = []
		log = ['Neues Spiel gestartet.']

		// Map neu generieren — $effect zeichnet automatisch neu
		generateMap()
		updateFOV()
		draw()
	}

	$effect(() => {
		if (!mounted) return
		updateFOV()
		draw()
	})

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
		generateMap()
		mounted = true

		updateFOV()
		draw()

		sleep()
			.then(() => {
				addLog(`Frame: ${FRAME.width} x ${FRAME.height}`)
			})
			.then(sleep)
			.then(() => {
				addLog('Willkommen im Dungeon!')
			})
			.then(sleep)
			.then(() => {
				addLog(`Hero @ ${player.pos.x} x ${player.pos.y}`)
			})

		window.addEventListener('keydown', handleInput)
		return () => window.removeEventListener('keydown', handleInput)
	})
	// $inspect(player.stats.hp)
</script>

<!-- HP-Anzeige über dem Spielfeld -->

<div class="d-navbar bg-neutral text-neutral-content shadow-sm">
	<div class="flex-1">
		<button class="d-btn d-btn-neutral text-xl">nwpUI</button>
	</div>
	<div class="flex-none">
		<div class="nav">
			<span style="color: oklch(57.7% 0.245 27.325)">♥</span>
			<div class="hp-bar-track">
				<div
					class="hp-bar-fill"
					style="width: {(player.stats.hp / player.stats.maxHp) * 100}%;
                 background: {player.stats.hp < 30
						? 'oklch(57.7% 0.245 27.325)'
						: 'oklch(0.7588 0.2948 142.51)'};">
				</div>
			</div>
			<span class="hp-text">{player.stats.hp} / {player.stats.maxHp}</span>
			<span class="stats-text"
				>ATK {player.stats.atk} DEF {player.stats.def}</span>
		</div>
	</div>
</div>
<main class="main">
	<section
		class="page page-fixed nwp relative"
		bind:clientWidth={FRAME.width}
		bind:clientHeight={FRAME.height}>
		<div class="grid flex-1 place-content-center">
			<div style="position: relative">
				<div id="game-container"></div>
				{#if gameOver}
					<GameOver onReset={resetGame} />
				{/if}
			</div>
		</div>
	</section>
	<footer
		class="foo-bar border-t-4 border-neutral bg-primary p-2 text-primary-content">
		{#each log.slice(0, 5) as entry, i (i)}
			<div style="opacity: {1 - i * 0.18}">{entry}</div>
		{/each}
		{#each getZeroLogs(5) as entry, id (id)}
			<div style="opacity: 0;">{entry}</div>
		{/each}
	</footer>
	<aside class="aside border-l-4 border-neutral bg-base-200">
		<div class="padded space-y-2">
			<Inventory
				inventory={player.inventory}
				onUse={onUseItem}
				onDrop={onDropItem} />

			<div></div>
		</div>
	</aside>
</main>
