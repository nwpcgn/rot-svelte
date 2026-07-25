<script lang="ts">
	import { sleep } from '$lib'
	import WheelTwo from '$components/WheelTwo.svelte'
	import Dialog from '$components/Dialog.svelte'
	const as = [
		{
			label: 'anne',
			name: 'Anne',
			color: 'oklch(.637 .237 25.331)',
			weight: 10,
			hidden: false,
			selected: true
		},
		{
			label: 'army',
			name: 'Army',
			color: 'oklch(.723 .219 149.579)',
			weight: 10,
			hidden: false,
			selected: true
		},
		{
			label: 'devil',
			name: 'Devil',
			color: 'oklch(.715 .143 215.221)',
			weight: 10,
			hidden: false,
			selected: true
		},
		{
			label: 'jenny',
			name: 'Jenny',
			color: 'oklch(.656 .241 354.308)',
			weight: 10,
			hidden: false,
			selected: true
		},
		{
			label: 'lady',
			name: 'Lady',
			color: 'oklch(.623 .214 259.815)',
			weight: 10,
			hidden: false,
			selected: true
		},
		{
			label: 'maid',
			name: 'Maid',
			color: 'oklch(.704 .14 182.503)',
			weight: 10,
			hidden: false,
			selected: true
		},
		{
			label: 'dolly',
			name: 'Dolly',
			color: 'oklch(.606 .25 292.717)',
			weight: 10,
			hidden: false,
			selected: false
		},
		{
			label: 'lara',
			name: 'Lara',
			color: 'oklch(.646 .222 41.116)',
			weight: 10,
			hidden: false,
			selected: false
		},
		{
			label: 'office',
			name: 'Office',
			color: 'oklch(.623 .214 259.815)',
			weight: 10,
			hidden: false,
			selected: false
		},
		{
			label: 'pink',
			name: 'Pink',
			color: 'oklch(.667 .295 322.15)',
			weight: 10,
			hidden: false,
			selected: false
		},
		{
			label: 'privat',
			name: 'Privat',
			color: 'oklch(.645 .246 16.439)',
			weight: 10,
			hidden: false,
			selected: false
		},
		{
			label: 'tanja',
			name: 'Tanja',
			color: 'oklch(.768 .233 130.85)',
			weight: 10,
			hidden: false,
			selected: false
		},
		{
			label: 'stack',
			name: 'Stack',
			color: 'oklch(.709 .01 56.259)',
			weight: 1,
			hidden: true,
			selected: true
		}
	]
	class DevelopmentItem {
		constructor(data) {
			Object.assign(this, data) // übernimmt alle Original-Properties
			this.stage = 1 // Startstufe
			this.maxStage = 4 // Endstufe
		}

		stepUp() {
			if (this.stage < this.maxStage) {
				this.stage++
			}
			return this.stage
		}

		reset() {
			this.stage = 1
			return this.stage
		}

		get isMaxStage() {
			return this.stage === this.maxStage
		}
	}
	async function getRandomItems(url, count = 4) {
		const response = await fetch(url)
		const data = await response.json() // Array von Objekten

		// Fisher-Yates Shuffle
		const shuffled = [...data]
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
		}

		return shuffled.slice(0, count)
	}

	const STAT = Object.freeze({
		READY: 'ready',
		RUN: 'run',
		END: 'end'
	})
	let dialog = $state()
	let status = $state(STAT.READY)
	let placed = $state()
	let spinResult = $state()
	let isSpinning = $state(false)
	let sectors: Sector[] = $state(as.filter((d) => d.selected))

	async function placeBet(e) {
		const slug = e.currentTarget.dataset.slug
		await sleep(100)
		if (slug) {
			placed = sectors.find((d) => d.label === slug)
		}
		await sleep(100)

		status = STAT.RUN
	}

	function resetWheel() {
		spinResult = null
		placed = null
	}
	function resetAll() {
		sectors.forEach((sec, i) => {
			sectors[i].step = 1
		})
		resetWheel()
	}

	const handleResult = async (e) => {
		const i = sectors.findIndex((se) => se.label === e.label)
		const v = sectors[i].step + 1
		if (v == 4) {
			sectors[i].weight = 500
		}

		spinResult = sectors[i]
		await sleep(200)
		status = STAT.END
		dialog?.showModal()
	}

	const handleDialogClose = async (e) => {
		const i = sectors.findIndex((se) => se.label === spinResult.label)
		const v = sectors[i].step + 1
		await sleep(400)
		sectors[i].step = Math.min(4, v)
		await sleep(200)
		restart()
	}

	async function restart() {
		spinResult = null
		placed = null
		status = STAT.READY
	}

	resetAll()

	const statColor = [
		'',
		'status-error',
		'status-warning',
		'status-info',
		'status-success'
	]
</script>

<section class="page nwp">
	<article>
		<header class="flex items-center justify-center gap-2 text-2xl">
			{#if placed}
				<em class="text-info">{placed.name}</em>
				{#if spinResult}
					| <span class="font-semibold text-accent">{spinResult.name}</span>
				{/if}
			{:else}
				<span class="font-semibold text-primary">Select</span>
			{/if}
		</header>
		<div
			class="grid grid-cols-3 gap-x-12 gap-y-4 p-8"
			style="--min: 20%; --gap: 1rem;">
			{#each sectors as { label, color, step, hidden, name } (label)}
				{#if !hidden}
					{@render image2(label, color, step, hidden, name)}
				{/if}
			{/each}
		</div>
	</article>
</section>

{#if status === 'run'}
	<section class="page nwp bg-neutral/90"></section>

	<WheelTwo bind:isSpinning {sectors} onResult={handleResult}></WheelTwo>
{/if}

{#if status === STAT.END}
	<section class="page nwp center">
		<div class="p-1">
			<button class="btn btn-ghost" onclick={restart}>Restart</button>
		</div>
	</section>
{/if}

{#snippet image2(label, color, step, hidden, name)}
	{@const isResult = spinResult?.label === label}
	{@const isBet = placed?.label === label}
	<div
		class="stacker rounded-box {!isResult ? 'outline-info' : 'outline-accent'}"
		class:outline-4={isResult || isBet}>
		<figure
			class="active relative rounded-box bg-neutral text-neutral-content transition-all duration-200">
			<figcaption class="p-2 capitalize">
				<div class="split">
					<span>
						{name}
					</span>
					<span class="flex gap-1">
						{#each [1, 2, 3, 4] as item (item)}
							<span class="status {step == item ? statColor[item] : ``}"></span>
						{/each}
					</span>
				</div>
				<!-- 		<progress
					class="transition-color progress delay-100 duration-200"
					class:progress-error={step == 1}
					class:progress-accent={step == 2}
					class:progress-primary={step == 3}
					class:progress-success={step == 4}
					min={1}
					value={step}
					max={4}></progress> -->
			</figcaption>
			<img src="/img/gang/{label}{step}.png" alt="" class="rounded-box" />
		</figure>
		{#if !placed}
			<div class="active items-end justify-end p-1">
				<button
					onclick={placeBet}
					class="btn btn-accent btn-sm"
					data-slug={label}>BET</button>
			</div>
		{/if}
	</div>
{/snippet}

<Dialog bind:dialog handleClose={handleDialogClose}>
	<div class="modal-box text-center">
		{#if status == STAT.END}
			<h2>{spinResult.hidden ? `You Loose` : `Congratulation`}</h2>
			<h6><em>bet on</em> <b class="text-info">{placed.name}</b></h6>
			<h4><em>You spinned</em> <b class="text-accent">{spinResult.name}</b></h4>

			<h1>{placed.label === spinResult.label ? `Bonus!!!` : ``}</h1>
		{/if}

		<div class="modal-action justify-center">
			<form method="dialog">
				<!-- if there is a button in form, it will close the modal -->
				<button class="btn btn-neutral">Close</button>
			</form>
		</div>
	</div>
</Dialog>
