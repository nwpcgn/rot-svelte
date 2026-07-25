<script lang="ts">
	import Swap from '$components/Swap.svelte'

	import { onMount } from 'svelte'

	// State variables
	let videoFile = $state(null)
	let videoElement = $state()
	let videoUrl = $state('')
	let canvasElement
	let ctx
	let screenshotGallery = $state([])
	let isAutoCapturing = $state(false)
	let captureInterval = $state(1000) // 1 second by default
	let intervalId = null
	let videoLoaded = $state(false)

	// Handle file upload
	function handleFileUpload(event) {
		const file = event.target.files[0]
		if (file && file.type.includes('video/')) {
			videoFile = file
			videoUrl = URL.createObjectURL(file)
			videoLoaded = false
		}
	}

	// Take a screenshot from the current video frame
	function takeScreenshot() {
		if (!videoElement || videoElement.paused || videoElement.ended) return

		// Set canvas dimensions to match video
		canvasElement.width = videoElement.videoWidth
		canvasElement.height = videoElement.videoHeight

		// Draw the current video frame to the canvas
		ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

		// Convert canvas to image data URL
		const imageDataUrl = canvasElement.toDataURL('image/png')

		// Add to gallery
		screenshotGallery = [
			...screenshotGallery,
			{
				id: Date.now(),
				src: imageDataUrl,
				timestamp: formatTime(videoElement.currentTime)
			}
		]
	}

	// Format time in seconds to MM:SS format
	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = Math.floor(seconds % 60)
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	// Format bytes to human-readable size
	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes'

		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	// Calculate megabytes from bytes
	function bytesToMB(bytes) {
		return (bytes / (1024 * 1024)).toFixed(2)
	}

	// Toggle automatic screenshot capture
	function toggleAutoCapture() {
		if (isAutoCapturing) {
			clearInterval(intervalId)
			intervalId = null
		} else {
			intervalId = setInterval(takeScreenshot, captureInterval)
		}
		isAutoCapturing = !isAutoCapturing
	}

	// Update capture interval
	function updateCaptureInterval(event) {
		captureInterval = event.target.value * 1000 // Convert to milliseconds
		if (isAutoCapturing) {
			clearInterval(intervalId)
			intervalId = setInterval(takeScreenshot, captureInterval)
		}
	}

	// Download a screenshot
	function downloadScreenshot(imageDataUrl, timestamp) {
		const a = document.createElement('a')
		a.href = imageDataUrl
		a.download = `screenshot-${timestamp.replace(':', '-')}.png`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}

	// Clear all screenshots
	function clearScreenshots() {
		screenshotGallery = []
	}

	// Handle video loaded
	function handleVideoLoaded() {
		videoLoaded = true
	}
	let time = $state(0)
	let duration = $state()
	let paused = $state(true)
	let volume = $state(0.5)
	let muted = $state(false)

	let showControls = $state(true)
	let showControlsTimeout

	function format(seconds) {
		if (isNaN(seconds)) return '...'

		const minutes = Math.floor(seconds / 60)
		seconds = Math.floor(seconds % 60)
		if (seconds < 10) seconds = '0' + seconds

		return `${minutes}:${seconds}`
	}
	// Clean up on component unmount
	onMount(() => {
		canvasElement = document.createElement('canvas')
		ctx = canvasElement.getContext('2d')

		return () => {
			if (videoUrl) URL.revokeObjectURL(videoUrl)
			if (intervalId) clearInterval(intervalId)
		}
	})
</script>

<section class="page nwp">
	<article>
		<h4>VOONDER</h4>

		<div class="mb-6">
			<label for="video-upload" class="mb-2 block font-medium">
				Upload Video File
			</label>
			<input
				id="video-upload"
				type="file"
				accept="video/*"
				onchange={handleFileUpload}
				class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900" />
		</div>

		{#if videoFile}
			<p class="mt-2 text-sm text-gray-600">
				File: {videoFile.name} ({bytesToMB(videoFile.size)} MB)
			</p>
		{/if}

		{#if videoUrl}
			<div class="mb-6">
				<div class="relative overflow-hidden rounded-lg bg-black">
					<video
						bind:this={videoElement}
						bind:currentTime={time}
						bind:duration
						bind:paused
						bind:volume
						bind:muted
						src={videoUrl}
						controls
						onloadeddata={handleVideoLoaded}
						class="mx-auto max-h-[60vh] w-full">
						Your browser does not support the video tag.
					</video>
				</div>
				<div class="flex justify-between gap-1 py-2">
					<div class="flex flex-row-reverse gap-1">
						{#each [1, 10, 60] as item (item)}
							<button
								class="btn"
								disabled={time - item < 0}
								onclick={() => {
									time = Math.max(0, time - item)
								}}>-{item}</button
							>{/each}

						<button
							class="btn"
							onclick={() => {
								time = 0
							}}>&#8656;</button>
					</div>
					<div>
						<button class="btn btn-ghost" onclick={() => (paused = !paused)}
							>{format(time)} / {format(duration)}</button>
					</div>
					<div class="flex gap-1">
						{#each [1, 10, 60] as item (item)}
							<button
								class="btn"
								disabled={time + item > duration}
								onclick={() => {
									time = Math.min(duration, time + item)
								}}>+{item}</button>
						{/each}
						<button
							class="btn"
							onclick={() => {
								time = duration
							}}>&#8658;</button>
					</div>
				</div>
				<div class="py-2">
					<input
						class="range w-full transition-colors duration-150 ease-in-out"
						class:range-primary={!paused}
						type="range"
						min={0}
						max={duration}
						value={time} />
				</div>
				<div class="nav" style="--fs: 32px;">
					<Swap on="icon-audio" off="icon-audio-off" bind:checked={muted}></Swap>


					
					<Swap on="icon-play" off="icon-pause" bind:checked={paused}></Swap>
				</div>
				{#if videoLoaded}
					<div class="mt-4 flex flex-wrap gap-4">
						<button
							onclick={takeScreenshot}
							class="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700">
							Take Screenshot
						</button>

						<button
							onclick={toggleAutoCapture}
							class={`px-4 py-2 ${isAutoCapturing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-lg text-white transition-colors`}>
							{isAutoCapturing ? 'Stop Auto Capture' : 'Start Auto Capture'}
						</button>

						{#if screenshotGallery.length > 0}
							<button
								onclick={clearScreenshots}
								class="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700">
								Clear All Screenshots
							</button>
						{/if}
					</div>

					<div class="mt-4">
						<label for="interval" class="mb-2 block font-medium">
							Auto Capture Interval (seconds): {captureInterval / 1000}
						</label>
						<input
							id="interval"
							type="range"
							min="0.1"
							max="10"
							step="0.1"
							value={captureInterval / 1000}
							oninput={updateCaptureInterval}
							class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200" />
					</div>
				{/if}
			</div>

			{#if screenshotGallery.length > 0}
				<div class="mt-8">
					<h2 class="mb-4 text-2xl font-bold">
						Screenshots ({screenshotGallery.length})
					</h2>
					<div
						class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						{#each screenshotGallery as screenshot (screenshot.id)}
							<div class="overflow-hidden rounded-lg border">
								<img
									src={screenshot.src || '/placeholder.svg'}
									alt={`Screenshot at ${screenshot.timestamp}`}
									class="h-auto w-full" />
								<div class="flex items-center justify-between bg-gray-100 p-2">
									<span class="text-sm font-medium"
										>{screenshot.timestamp}</span>
									<button
										onclick={() =>
											downloadScreenshot(screenshot.src, screenshot.timestamp)}
										class="text-blue-600 hover:text-blue-800">
										Download
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{:else}
			<div class="rounded-lg bg-gray-100 p-8 text-center">
				<p class="text-lg">Upload a video file to get started</p>
			</div>
		{/if}
	</article>
</section>
