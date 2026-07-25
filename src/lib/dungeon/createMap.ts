import * as ROT from 'rot-js'

export const TILES = {
	FLOOR: 0,
	WALL: 1,
	DOOR_CLOSED: 2,
	DOOR_OPEN: 3,
	STAIRS: 4
} as const

export type Tile = (typeof TILES)[keyof typeof TILES]

export interface Position {
	x: number
	y: number
}

export interface Room {
	id: number
	x: number
	y: number
	width: number
	height: number
}

export interface MapResult {
	map: Tile[][]
	rooms: Room[]
	start: Position
	exit: Position
}
export function createMap(width: number, height: number): MapResult {
	const digger = new ROT.Map.Digger(width, height)

	// Map initialisieren
	const map: Tile[][] = Array.from({ length: height }, () =>
		Array(width).fill(TILES.WALL)
	)

	// Dungeon generieren
	digger.create((x: number, y: number, value: number) => {
		map[y][x] = value === 0 ? TILES.FLOOR : TILES.WALL
	})

	const rawRooms = digger.getRooms()

	// Räume transformieren
	const rooms: Room[] = rawRooms.map((room, i) => ({
		id: i,
		x: room.getLeft(),
		y: room.getTop(),
		width: room.getRight() - room.getLeft() + 1,
		height: room.getBottom() - room.getTop() + 1
	}))

	// 🟢 Start
	const startRoom = rawRooms[0]
	const [startX, startY] = startRoom.getCenter()
	const start: Position = { x: startX, y: startY }

	// 🚪 Exit (weitester Raum)
	function distance(a: [number, number], b: [number, number]) {
		return Math.hypot(a[0] - b[0], a[1] - b[1])
	}

	let exitRoom = rawRooms[0]
	let maxDist = 0

	for (const room of rawRooms) {
		const center = room.getCenter()
		const dist = distance(center, [startX, startY])

		if (dist > maxDist) {
			maxDist = dist
			exitRoom = room
		}
	}

	const [exitX, exitY] = exitRoom.getCenter()
	const exit: Position = { x: exitX, y: exitY }

	// 🪜 Stairs setzen
	map[exitY][exitX] = TILES.STAIRS

	// 🚪 Türen setzen
	rawRooms.forEach((room) => {
		room.getDoors((x: number, y: number) => {
			map[y][x] = TILES.DOOR_CLOSED
		})
	})

	return {
		map,
		rooms,
		start,
		exit
	}
}
