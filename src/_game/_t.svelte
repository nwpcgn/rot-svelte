<script lang="ts">
	// ... alle bisherigen imports
	import { isAlive } from '$lib/actor'
	import GameOver from '$lib/GameOver.svelte'

	// Neu: abgeleiteter State — kein separates $state nötig
	const gameOver = $derived(!isAlive(player))

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
	}
</script>

<!-- Wrapper mit position:relative damit das Overlay korrekt positioniert wird -->
<div class="game-wrap">
	<div class="game-main">
		<!-- HP-Anzeige über dem Spielfeld -->
		<div class="hud">
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

		<!-- Spielfeld + Game Over Overlay -->
		<div style="position: relative">
			<div id="game-container"></div>
			{#if gameOver}
				<GameOver onReset={resetGame} />
			{/if}
		</div>

		<div class="log">
			{#each log.slice(0, 5) as entry, i}
				<div style="opacity: {1 - i * 0.18}">{entry}</div>
			{/each}
		</div>
	</div>

	<Inventory
		inventory={player.inventory}
		onUse={onUseItem}
		onDrop={onDropItem} />
</div>

<style>
	.game-wrap {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		font-family: monospace;
	}

	.game-main {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hud {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.75rem;
		color: oklch(85% 0 0);
		padding: 0.3rem 0;
	}

	.hp-bar-track {
		width: 100px;
		height: 6px;
		background: oklch(22% 0 0);
		border-radius: 2px;
		overflow: hidden;
	}

	.hp-bar-fill {
		height: 100%;
		border-radius: 2px;
		transition:
			width 0.2s,
			background 0.2s;
	}

	.hp-text {
		color: oklch(70% 0 0);
	}

	.stats-text {
		margin-left: auto;
		color: oklch(45% 0 0);
		font-size: 0.7rem;
		letter-spacing: 0.05em;
	}

	#game-container {
		background: black;
		border: 2px solid #333;
	}

	.log {
		font-size: 0.72rem;
		color: oklch(70% 0 0);
		background: oklch(14% 0 0);
		border: 1px solid oklch(22% 0 0);
		padding: 0.5rem 0.75rem;
		min-height: 5rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
</style>
