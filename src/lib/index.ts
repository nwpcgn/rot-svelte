// place files you want to import through the `$lib` alias in this folder.
// @index('./utils/*.ts', (f, _) => `export { default as ${_.camelCase(f.name)} } from '${f.path}'`)
export { default as assetLoader } from './utils/assetLoader'
export { default as copyToClip } from './utils/copyToClip'
export { default as getFighter } from './utils/getFighter'
export { default as getKey } from './utils/getKey'
export { default as getMsg } from './utils/getMsg'
export { default as parseKey } from './utils/parseKey'
export { default as parseNumber } from './utils/parseNumber'
export { default as randNum } from './utils/randNum'
export { default as randRow } from './utils/randRow'
export { default as shuffle } from './utils/shuffle'
export { default as sleep } from './utils/sleep'
export { default as typewriter } from './utils/typewriter'
export { default as uuid } from './utils/uuid'
// @endindex
// @index('./comp/*.svelte', (f, _) => `export { default as ${_.pascalCase(f.name)} } from '${f.path}${f.ext}'`)

// @endindex
// @index('./components/**/*.svelte', (f, _) => `export { default as ${_.pascalCase(f.name)} } from '${f.path}${f.ext}'`)

// @endindex

export const HERO = {
	id: 'ek6y77',
	name: 'Sage',
	info: 'Sentinel',
	hp: 29,
	maxHp: 29,
	atc: 9,
	def: 5,
	level: 2,
	img: 'https://i.imgur.com/VPNmyjN.png',
	avatar: 'https://i.imgur.com/60RcWaY.png',
	moves: [
		{
			name: 'Quick Jab',
			dice: 4,
			damage: 5,
			info: 'You attack swiftly before the enemy can react.'
		},
		{
			name: 'Holy Light',
			dice: 5,
			damage: 6,
			info: 'You blast the target with pure radiant energy.'
		}
	]
}

export const LORE = [
	{
		slide: 1,
		set: 'Set1',
		title: 'Die Nacht des Verrats',
		text: 'Als der Mond über dem Shōganat stand, fiel das Schwert der Intrige. Ein einziger Angriff löschte einen ganzen Clan aus – bis auf eine Überlebende.'
	},
	{
		slide: 2,
		set: 'Set1',
		title: 'Der Pfad der Einsamkeit',
		text: 'Verbannt und verfolgt wandert sie durch vom Krieg gezeichnete Provinzen. Jeder Schritt führt tiefer in eine Welt aus Lügen und Schwüren.'
	},
	{
		slide: 3,
		set: 'Set1',
		title: 'Die Schatten von Edo',
		text: 'In den Gassen der Hauptstadt hört man ihren Namen nur im Flüstern. Feinde lauern überall.'
	},
	{
		slide: 4,
		set: 'Set1',
		title: 'Klinge des Eides',
		text: 'Die alte Waffe ihres Clans erwacht erneut zum Leben und erinnert sie an ihre Pflicht.'
	},
	{
		slide: 5,
		set: 'Set1',
		title: 'Das letzte Tor',
		text: 'Am Tor der Festung entscheidet sich ihr Schicksal zwischen Vergangenheit und Neubeginn.'
	},
	{
		slide: 1,
		set: 'Set2',
		title: 'Blut unter Kirschblüten',
		text: 'Die Blüten fallen wie Schnee, doch unter ihnen verbirgt sich das Blut der Unschuldigen.'
	},
	{
		slide: 2,
		set: 'Set2',
		title: 'Der gebrochene Schwur',
		text: 'Ein früherer Verbündeter wurde zum Verräter – doch sein Motiv bleibt im Dunkeln.'
	},
	{
		slide: 3,
		set: 'Set2',
		title: 'Flüstern im Bambuswald',
		text: 'Im raschelnden Wald erkennt sie Hinweise auf eine Macht, die größer ist als jeder Clan.'
	},
	{
		slide: 4,
		set: 'Set2',
		title: 'Der wandernde Ronin',
		text: 'Ein mysteriöser Kämpfer kreuzt ihren Weg – Freund oder Feind wird sich zeigen.'
	},
	{
		slide: 5,
		set: 'Set2',
		title: 'Die Stadt der maskierten Augen',
		text: 'Eine verborgene Gesellschaft beobachtet jeden ihrer Schritte aus den Schatten.'
	},
	{
		slide: 1,
		set: 'Set3',
		title: 'Der rote Mond',
		text: 'Wenn der Mond rot scheint, erwachen alte Legenden – und alte Feinde.'
	},
	{
		slide: 2,
		set: 'Set3',
		title: 'Aufstieg der Aschenklinge',
		text: 'Aus Schmerz entsteht Stärke: Ihre neue Technik wird aus purer Entschlossenheit geformt.'
	},
	{
		slide: 3,
		set: 'Set3',
		title: 'Das verlorene Siegel',
		text: 'Ein gestohlenes Clan-Siegel enthüllt die Verbindung zu einem uralten Konflikt.'
	},
	{
		slide: 4,
		set: 'Set3',
		title: 'Der Pfad der Sechs Prüfungen',
		text: 'Sechs Prüfungen trennen sie von der Wahrheit – jede härter als die vorherige.'
	},
	{
		slide: 5,
		set: 'Set3',
		title: 'Der letzte Atemzug des Shōguns',
		text: 'Am Hof des Shōguns kommt alles ans Licht – und ein Reich steht vor dem Umbruch.'
	}
]

export const colorSchema = [
	{
		slug: 'accent',
		btn: 'btn-accent',
		bg: 'oklch(65% 0.241 354.308)',
		fg: 'oklch(94% 0.028 342.258)',
		common: false
	},
	{
		slug: 'error',
		btn: 'btn-error',
		bg: 'oklch(63% 0.237 25.331)',
		fg: 'oklch(93% 0.032 17.717)',
		common: true
	},
	{
		slug: 'info',
		btn: 'btn-info',
		bg: 'oklch(58% 0.158 241.966)',
		fg: 'oklch(96% 0.059 95.617)',
		common: true
	},
	{
		slug: 'neutral',
		btn: 'btn-neutral',
		bg: 'oklch(44% 0.011 73.639)',
		fg: 'oklch(86% 0.005 56.366)',
		common: false
	},
	{
		slug: 'primary',
		btn: 'btn-primary',
		bg: 'oklch(80% 0.114 19.571)',
		fg: 'oklch(39% 0.141 25.723)',
		common: false
	},
	{
		slug: 'secondary',
		btn: 'btn-secondary',
		bg: 'oklch(84% 0.143 164.978)',
		fg: 'oklch(43% 0.095 166.913)',
		common: false
	},
	{
		slug: 'success',
		btn: 'btn-success',
		bg: 'oklch(51% 0.096 186.391)',
		fg: 'oklch(96% 0.059 95.617)',
		common: true
	},
	{
		slug: 'warning',
		btn: 'btn-warning',
		bg: 'oklch(76% 0.188 70.08)',
		fg: 'oklch(41% 0.112 45.904)',
		common: true
	}
]

export const navi = [
	{
		href: '/',
		name: 'Lobby',
		icon: 'game-start',
		slug: 'lobby',
		hidden: true
	},
	{
		href: '/battle',
		name: 'Battle',
		icon: 'game-dice-1',
		slug: 'battle',
		hidden: false
	},
	{
		href: '/dungeon',
		name: 'Dungeon',
		icon: 'game-dice-2',
		slug: 'dungeon',
		hidden: false
	}
]
