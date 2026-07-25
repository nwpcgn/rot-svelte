<script lang="ts">
	import { onMount, onDestroy } from 'svelte'

	type Sector = {
		color: string
		label: string
		/** Relative win probability. Defaults to 1 if omitted (= equal odds). */
		weight?: number
		chance?: number
	}

	interface Props {
		/** Called once the wheel comes to a stop, with the winning sector. */
		onResult?: (sector: Sector) => void
	}

	let { onResult }: Props = $props()

	let wheel = $state<HTMLCanvasElement>()
	let spin = $state<HTMLButtonElement>()
	let ctx: CanvasRenderingContext2D | undefined

	let isSpinning = $state(false)
	let animFrame: number | null = null

	// Hold-to-charge: the longer spin is pressed, the more dramatic the spin
	// (more rotations, longer duration) - it does NOT affect which sector wins.
	let holdProgress = $state(0) // 0..1, drives the visual charge feedback
	let chargeStart: number | null = null
	let chargeFrame: number | null = null
	const MAX_HOLD_MS = 1200 // holding this long (or longer) = full power

	// Adjust these weights to change the odds per sector. Higher = more likely.
	const sectors: Sector[] = [
		{
			color: '#f82',
			label: 'Stack',
			weight: 5,
			chance: 1
		},
		{
			color: '#0bf',
			label: 10,
			weight: 30,
			chance: 1
		},
		{
			color: '#fb0',
			label: 200,
			weight: 8,
			chance: 1
		},
		{
			color: '#0fb',
			label: 50,
			weight: 15,
			chance: 1
		},
		{
			color: '#b0f',
			label: 100,
			weight: 10,
			chance: 1
		},
		{
			color: '#f0b',
			label: 5,
			weight: 35,
			chance: 1
		},
		{
			color: '#bf0',
			label: 500,
			weight: 2,
			chance: 1
		}
	]

	const tot = sectors.length
	const dia = 360
	const rad = dia / 2
	const PI = Math.PI
	const TAU = 2 * PI
	const arc = TAU / tot

	// Spin animation tuning (duration/rotations only - not the outcome)
	const MIN_SPIN_MS = 2500
	const MAX_SPIN_MS = 5000
	const MIN_ROTATIONS = 3
	const MAX_ROTATIONS = 6

	let ang = 0 // current angle, wrapped to [0, TAU) - used for rendering
	let angTotal = 0 // unwrapped angle - used for tweening across many rotations

	let spinStartTime: number | null = null
	let spinStartAng = 0
	let spinTargetAng = 0
	let spinDurationMs = 0

	const rand = (min: number, max: number) => Math.random() * (max - min) + min
	const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
	const getIndex = () => Math.floor(tot - (ang / TAU) * tot) % tot

	/** Weighted random pick: sectors with a higher `weight` come up more often. */
	function pickWeightedIndex(): number {
		const totalWeight = sectors.reduce((sum, s) => sum + (s.weight ?? 1), 0)
		let r = Math.random() * totalWeight
		for (let i = 0; i < sectors.length; i++) {
			r -= sectors[i].weight ?? 1
			if (r <= 0) return i
		}
		return sectors.length - 1 // floating-point safety net
	}

	/** Smallest forward angle (from fromAngTotal) that lands the pointer inside sector `index`. */
	function computeTargetAngle(index: number, fromAngTotal: number): number {
		const currentMod = ((fromAngTotal % TAU) + TAU) % TAU
		// land somewhere safely inside the sector, not right on its edge
		const x = tot - index - rand(0.15, 0.85)
		const targetMod = ((((x / tot) * TAU) % TAU) + TAU) % TAU
		let delta = targetMod - currentMod
		if (delta <= 0) delta += TAU
		return fromAngTotal + delta
	}

	function drawSector(sector: Sector, i: number) {
		if (!ctx) return
		const sectorAngle = arc * i
		ctx.save()
		// COLOR
		ctx.beginPath()
		ctx.fillStyle = sector.color
		ctx.moveTo(rad, rad)
		ctx.arc(rad, rad, rad, sectorAngle, sectorAngle + arc)
		ctx.lineTo(rad, rad)
		ctx.fill()
		// TEXT
		ctx.translate(rad, rad)
		ctx.rotate(sectorAngle + arc / 2)
		ctx.textAlign = 'right'
		ctx.fillStyle = '#fff'
		ctx.font = 'bold 30px sans-serif'
		ctx.fillText(sector.label, rad - 10, 10)
		ctx.restore()
	}

	function rotate(): Sector | undefined {
		if (!wheel || !spin) return
		const sector = sectors[getIndex()]
		wheel.style.transform = `rotate(${ang - PI / 2}rad)`
		spin.textContent = isSpinning ? sector.label : 'SPIN'
		spin.style.background = sector.color
		spin.style.color = '#eee'
		return sector
	}

	function tweenFrame(now: number) {
		if (spinStartTime === null) return
		const t = Math.min((now - spinStartTime) / spinDurationMs, 1)
		angTotal = spinStartAng + (spinTargetAng - spinStartAng) * easeOutCubic(t)
		ang = ((angTotal % TAU) + TAU) % TAU
		const sector = rotate()

		if (t < 1) {
			animFrame = requestAnimationFrame(tweenFrame)
		} else {
			isSpinning = false
			spinStartTime = null
			animFrame = null
			if (sector) onResult?.(sector)
		}
	}

	/** @param power 0..1 - how "charged" the spin is (affects drama, not the outcome) */
	function handleSpin(power = 1) {
		if (isSpinning) return
		isSpinning = true

		const targetIndex = pickWeightedIndex()
		const rotations = MIN_ROTATIONS + power * (MAX_ROTATIONS - MIN_ROTATIONS)

		spinStartAng = angTotal
		spinTargetAng = computeTargetAngle(targetIndex, angTotal) + rotations * TAU
		spinDurationMs = MIN_SPIN_MS + power * (MAX_SPIN_MS - MIN_SPIN_MS)
		spinStartTime = performance.now()

		animFrame = requestAnimationFrame(tweenFrame)
	}

	function updateCharge() {
		if (chargeStart === null) return
		holdProgress = Math.min((performance.now() - chargeStart) / MAX_HOLD_MS, 1)
		chargeFrame = requestAnimationFrame(updateCharge)
	}

	function startCharge() {
		if (isSpinning || chargeStart !== null) return
		chargeStart = performance.now()
		updateCharge()
	}

	function releaseCharge() {
		if (chargeStart === null) return
		const power = Math.min((performance.now() - chargeStart) / MAX_HOLD_MS, 1)
		stopCharging()
		handleSpin(power)
	}

	function stopCharging() {
		chargeStart = null
		holdProgress = 0
		if (chargeFrame !== null) {
			cancelAnimationFrame(chargeFrame)
			chargeFrame = null
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.code !== 'Space' && e.code !== 'Enter') return
		e.preventDefault() // stop page scroll / repeated triggers
		startCharge()
	}

	function handleKeyup(e: KeyboardEvent) {
		if (e.code !== 'Space' && e.code !== 'Enter') return
		e.preventDefault()
		releaseCharge()
	}

	onMount(() => {
		if (!wheel) return
		ctx = wheel.getContext('2d') ?? undefined
		sectors.forEach(drawSector)
		rotate()
	})

	onDestroy(() => {
		if (animFrame !== null) cancelAnimationFrame(animFrame)
		if (chargeFrame !== null) cancelAnimationFrame(chargeFrame)
	})
</script>

{#snippet scheibe()}
	<div id="wheelOfFortune">
		<canvas
			bind:this={wheel}
			id="wheel"
			width={dia}
			height={dia}
			aria-hidden="true"></canvas>
		<button
			type="button"
			bind:this={spin}
			id="spin"
			onpointerdown={startCharge}
			onpointerup={releaseCharge}
			onpointerleave={stopCharging}
			onpointercancel={stopCharging}
			onkeydown={handleKeydown}
			onkeyup={handleKeyup}
			disabled={isSpinning}
			aria-live="polite"
			style="transform: scale({1 + holdProgress * 0.12})">
			SPIN
		</button>
	</div>
{/snippet}

<section class="page nwp">
	<article>
		<h4 class="text-center">YACERO</h4>
	</article>
</section>
<section class="page nwp center">
	<div class="padded shadow">
		{@render scheibe()}
	</div>
</section>

<style>
	#wheelOfFortune {
		display: inline-flex;
		position: relative;
		overflow: hidden;
	}

	#wheel {
		display: block;
	}

	#spin {
		font: 1.5rem/0 sans-serif;
		user-select: none;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		top: 50%;
		left: 50%;
		width: 30%;
		height: 30%;
		margin: -15%;
		padding: 0;
		border: none;
		background: #fff;
		color: #fff;
		box-shadow:
			0 0 0 8px currentColor,
			0 0px 15px 5px rgba(0, 0, 0, 0.6);
		border-radius: 50%;
		transition:
			background-color 0.8s,
			color 0.8s,
			box-shadow 0.8s;
	}

	#spin:disabled {
		cursor: not-allowed;
	}

	#spin::after {
		content: '';
		position: absolute;
		top: -17px;
		border: 10px solid transparent;
		border-bottom-color: currentColor;
		border-top: none;
	}
</style>
