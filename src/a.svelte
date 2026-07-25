<script lang="ts">
	import { Fallback, Route, Router } from '@svelte-router/core'

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
	const sectorsAll = [
		{
			slug: 'KAZEN',
			color: 'oklch(70.4% 0.191 22.216)',
			label: 'Stack',
			title: 'Klinge des Schicksals',
			text: 'Ein einziger Schnitt entscheidet über Ruhm oder Untergang.'
		},
		{
			slug: 'REIKA',
			color: 'oklch(78.9% 0.154 211.53)',
			label: '100',
			title: 'Ruf der Ahnen',
			text: 'Ihre Stimmen leiten dich – oder führen dich in die Dunkelheit.'
		},
		{
			slug: 'HONJU',
			color: 'oklch(76.9% 0.188 70.08)',
			label: '600',
			title: 'Pfad der Ehre',
			text: 'Wer Ehre wählt, verliert vielleicht den Sieg – aber nie sich selbst.'
		}
		// {
		// 	slug: 'KUROI',
		// 	color: 'oklch(76.8% 0.233 130.85)',
		// 	label: '200',
		// 	title: 'Schatten des Kriegers',
		// 	text: 'Wo Licht ist, fällt auch Schatten. Jeder Sieg hat seinen Preis.'
		// },
		// {
		// 	slug: 'RYUHA',
		// 	color: 'oklch(66.7% 0.295 322.15)',
		// 	label: '500',
		// 	title: 'Atem des Drachen',
		// 	text: 'Mut, der in Flammen brennt – entfessle die Macht deines Geistes.'
		// },
		// {
		// 	slug: 'SEIKA',
		// 	color: 'oklch(60.6% 0.25 292.717)',
		// 	label: '300',
		// 	title: 'Stille des Stahls',
		// 	text: 'Vor dem Schlag – ein Atemzug. Vor dem Sieg – ein Herzschlag.'
		// },
		// {
		// 	slug: 'TSUKI',
		// 	color: 'oklch(69.6% 0.17 162.48)',
		// 	label: '400',
		// 	title: 'Segen des Mondes',
		// 	text: 'Der Mond wacht über jene, die in der Nacht kämpfen – und über jene, die fallen.'
		// }
	]
	const sel = [
		{
			slug: 'anne',
			label: 'Anne',
			color: 'oklch(63.7% 0.237 25.331)',
			img: 'https://i.imgur.com/JGHVwT8.png',
			width: 250,
			height: 448
		},
		{
			slug: 'army',
			label: 'Army',
			color: 'oklch(76.9% 0.188 70.08)',
			img: 'https://i.imgur.com/ePfntfn.png',
			width: 250,
			height: 448
		},
		{
			slug: 'asmodina',
			label: 'Asmodina',
			color: 'oklch(76.8% 0.233 130.85)',
			img: 'https://i.imgur.com/ZcT4hon.png',
			width: 250,
			height: 448
		},
		{
			slug: 'comtess',
			label: 'Comtess',
			color: 'oklch(70.4% 0.14 182.503)',
			img: 'https://i.imgur.com/jttrpoL.png',
			width: 250,
			height: 448
		},
		{
			slug: 'dolly',
			label: 'Dolly',
			color: 'oklch(68.5% 0.169 237.323)',
			img: 'https://i.imgur.com/L3Xf0Sa.png',
			width: 250,
			height: 448
		},
		{
			slug: 'jenny',
			label: 'Jenny',
			color: 'oklch(58.5% 0.233 277.117)',
			img: 'https://i.imgur.com/BzOfPQC.png',
			width: 250,
			height: 448
		},
		{
			slug: 'lara',
			label: 'Lara',
			color: 'oklch(62.7% 0.265 303.9)',
			img: 'https://i.imgur.com/8TPkhxR.png',
			width: 250,
			height: 448
		},
		{
			slug: 'maid',
			label: 'Maid',
			color: 'oklch(65.6% 0.241 354.308)',
			img: 'https://i.imgur.com/PFemIKC.png',
			width: 250,
			height: 448
		},
		{
			slug: 'office',
			label: 'Office',
			color: 'oklch(64.5% 0.246 16.439)',
			img: 'https://i.imgur.com/MbQhbiV.png',
			width: 250,
			height: 448
		},
		{
			slug: 'pink',
			label: 'Pink',
			color: 'oklch(66.7% 0.295 322.15)',
			img: 'https://i.imgur.com/06MVQ8X.png',
			width: 250,
			height: 448
		},
		{
			slug: 'privat',
			label: 'Privat',
			color: 'oklch(60.6% 0.25 292.717)',
			img: 'https://i.imgur.com/yYRJCfg.png',
			width: 250,
			height: 448
		},
		{
			slug: 'tanja',
			label: 'Tanja',
			color: 'oklch(62.3% 0.214 259.815)',
			img: 'https://i.imgur.com/ALyQ3ls.png',
			width: 250,
			height: 448
		}
	]
	const borderStyle = 'bg-base-100 border border-base-300'
</script>

<Route path="/yacero" key="yacero">
	<section class="page nwp">
		<article>
			<h4>YACERO</h4>
		</article>
	</section>
</Route>

<Route path="/yombu" key="yombu">
	<section class="page nwp">
		<article>
			<h4>YOMBU</h4>
		</article>
	</section>
</Route>

<Route path="/zava" key="zava">
	<section class="page nwp">
		<article>
			<h4>ZAVA</h4>
		</article>
	</section>
</Route>

<Route path="/yamia" key="yamia">
	<section class="page nwp">
		<article>
			<h4>YAMIA</h4>
		</article>
	</section>
</Route>

<Route path="/voonder" key="voonder">
	<section class="page nwp">
		<article>
			<h4>VOONDER</h4>
		</article>
	</section>
</Route>

<Route path="/edgeify" key="edgeify">
	<section class="page nwp">
		<article>
			<h4>EDGEIFY</h4>
		</article>
	</section>
</Route>
