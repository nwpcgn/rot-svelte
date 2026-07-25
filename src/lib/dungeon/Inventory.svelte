<script lang="ts">
	import type { Item } from './items'

	type Props = {
		inventory: Item[]
		onUse: (item: Item) => void
		onDrop: (item: Item) => void
	}
	let { inventory, onUse, onDrop }: Props = $props()

	// Welches Item ist gerade ausgewählt (per Index im Array)
	let selectedIndex = $state<number | null>(null)

	const selectedItem = $derived(
		selectedIndex !== null ? inventory[selectedIndex] : null
	)

	// Gruppiert für die Listenanzeige — aber selectedIndex zeigt auf Original-Array
	const grouped = $derived(
		Object.values(
			inventory.reduce<Record<string, { item: Item; indices: number[] }>>(
				(acc, item, i) => {
					if (acc[item.name]) {
						acc[item.name].indices.push(i)
					} else {
						acc[item.name] = { item, indices: [i] }
					}
					return acc
				},
				{}
			)
		)
	)

	function handleUse() {
		if (!selectedItem) return
		onUse(selectedItem)
		selectedIndex = null
	}

	function handleDrop() {
		if (!selectedItem) return
		onDrop(selectedItem)
		selectedIndex = null
	}
</script>

<div>
	<header class="split padded bg-neutral text-neutral-content">
		<span class="font-bold tracking-wide">Inventar </span>
		<span>({inventory.length})</span>
	</header>
	<div class="list bg-base-100 text-base-content">
		{#if inventory.length === 0}
			<div class="list-row opacity-60">
				<span class="list-col-grow"> — leer —</span>
				<span></span>
			</div>
		{:else}
			{#each grouped as { item, indices }}
				{@const isSelected =
					selectedIndex !== null && indices.includes(selectedIndex)}

				<button
					class="list-row cursor-pointer"
					class:bg-sky-200={isSelected}
					onclick={() => (selectedIndex = isSelected ? null : indices[0])}>
					<span class="font-bold" style="color: {item.color}">{item.char}</span>
					<span class="text-left">{item.name}</span>

					{#if indices.length > 1}
						<span class="badge badge-sm badge-accent">×{indices.length}</span>
					{/if}
				</button>
			{/each}
		{/if}
	</div>

	{#if inventory.length}
		<header
			class="split p-2 transition-all duration-300 {selectedItem
				? 'bg-primary text-primary-content'
				: 'text-info-error bg-error'}">
			<span>{selectedItem ? 'Edit' : 'Auswählen…'}</span>
			<span></span>
		</header>
		{#if selectedItem}
			<div
				class="list bg-base-100 text-base-content"
				class:active={selectedItem}>
				<div class="list-row">
					<span style="color: {selectedItem.color}; font-size: 1.2rem"
						>{selectedItem.char}</span>
					<span class="detail-name flex-1">{selectedItem.name}</span>
					<span>{selectedItem.value} {selectedItem.effect}</span>
				</div>
				<div class="list-row">
					<div class="list-col-grow grid grid-cols-2 gap-2">
						<button class="btn btn-neutral" onclick={handleUse}>Use</button>
						<button class="btn btn-error" onclick={handleDrop}>Remove</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
