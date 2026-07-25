<script lang="ts">
	import Sprites from './components/Sprites.svelte'

	import DunGrid from './lib/dungeon/DunGrid.svelte'

	import Battle from './Battle.svelte'

	import Bj from './Bj.svelte'

	import Wheel from './Wheel.svelte'
	import WheelOne from '$components/WheelOne.svelte'
	import { Fallback, Route, Router } from '@svelte-router/core'
	import Game from '$game/Game.svelte'

	const navi = [
		{
			href: '/',
			name: 'Lobby',
			icon: 'game-start',
			slug: 'lobby',
			hidden: true
		},
		{
			href: '/yacero',
			name: 'Yacero',
			icon: 'game-dice-1',
			slug: 'yacero',
			hidden: false
		},
		{
			href: '/yombu',
			name: 'Yombu',
			icon: 'game-dice-2',
			slug: 'yombu',
			hidden: false
		},
		{
			href: '/zava',
			name: 'Zava',
			icon: 'game-dice',
			slug: 'zava',
			hidden: false
		},
		{
			href: '/yamia',
			name: 'Yamia',
			icon: 'game-dice',
			slug: 'yamia',
			hidden: false
		},
		{
			href: '/voonder',
			name: 'Voonder',
			icon: 'game-dice',
			slug: 'voonder',
			hidden: false
		},
		{
			href: '/edgeify',
			name: 'Edgeify',
			icon: 'game-dice',
			slug: 'edgeify',
			hidden: false
		}
	]
</script>

<Sprites></Sprites>
<Router>
	<div class="navbar bg-base-200 shadow">
		<div class="navbar-start">
			<div class="dropdown">
				<div tabindex="0" class="btn btn-ghost lg:hidden">☰</div>
				<ul class="dropdown-content menu mt-3 menu-sm bg-base-100 p-2 shadow">
					<li><a>Item 1</a></li>
				</ul>
			</div>
			<a href="#/" class="btn btn-ghost text-xl">App</a>
		</div>

		<div class="navbar-end hidden lg:flex">
			<ul class="menu menu-horizontal px-1">
				<li><a>Item</a></li>
			</ul>
		</div>
	</div>
	<main class="main">
		<Route path="/" key="lobby">
			<section class="page nwp center">
				<div class="padded">
					<h2 class="mb-2 text-center">Lobby</h2>
					<div class="flex justify-center">
						<nav class="grid w-56 gap-1">
							{#each navi as { name, href, slug, hidden }, i (i)}
								{#if !hidden}
									<a href="#{href}" class="btn">
										<div class="list-col-grow">{name}</div>
									</a>
								{/if}
							{/each}
						</nav>
					</div>
				</div>
			</section>
		</Route>
		<Route path="/yacero" key="yacero">
			<WheelOne></WheelOne>
		</Route>

		<Route path="/yombu" key="yombu">
			<Wheel></Wheel>
		</Route>

		<Route path="/zava" key="zava">
			<Game></Game>
		</Route>

		<Route path="/yamia" key="yamia">
			<!-- 		<section class="page nwp">
				<article>
					<h4>YAMIA</h4>
				</article>
			</section> -->
			<Bj></Bj>
		</Route>

		<Route path="/voonder" key="voonder">
			<Battle></Battle>
		</Route>

		<Route path="/edgeify" key="edgeify">
			<DunGrid></DunGrid>
		</Route>
	</main>
</Router>
