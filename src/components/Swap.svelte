<script lang="ts">
	let { on = 'icon-audio', off = 'icon-audio-off', checked = $bindable() } = $props()

	const handleToggle = () => {
		// console.log('handleToggle', checked)
	}
</script>

<label class="swap">
	<!-- this hidden checkbox controls the state -->
	<input bind:checked type="checkbox" onchange={handleToggle} />

	<!-- volume on icon -->
	<svg class="icon swap-on">
		<use xlink:href="#{on}"></use>
	</svg>

	<!-- volume off icon -->
	<svg class="icon swap-off">
		<use xlink:href="#{off}"></use>
	</svg>
</label>

{#snippet iconT(name)}
	<svg class="nwp-icon game-dice"><use xlink:href="#{name}"></use></svg>
{/snippet}
