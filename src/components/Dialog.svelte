<script>
	let { dialog = $bindable(), children, handleClose } = $props()
</script>

<dialog class="modal" bind:this={dialog} onclose={handleClose}>
	{@render children?.()}
</dialog>
