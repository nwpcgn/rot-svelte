import * as ROT from 'rot-js'
import type { IRenderer, DrawOptions } from '../types'

export class RotRenderer implements IRenderer {
	private display!: ROT.Display

	init(width: number, height: number, tileSize: number): HTMLElement {
		this.display = new ROT.Display({
			width,
			height,
			fontSize: tileSize,
			forceSquareRatio: true
		})
		return this.display.getContainer()!
	}

	clear(): void {
		this.display.clear()
	}

	draw({ x, y, char, fg = '#fff', bg }: DrawOptions): void {
		this.display.draw(x, y, char, fg, bg ?? null)
	}
}
