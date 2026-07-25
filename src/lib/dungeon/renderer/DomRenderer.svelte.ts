import type { IRenderer, DrawOptions } from '../types'

// Zwei Modi: Zeichen oder Tile-ID (Zahl)
export type DomRenderMode = 'char' | 'map'

export class DomRenderer implements IRenderer {
	mode: DomRenderMode
	// cells[y][x] = das DOM-Element für dieses Tile
	private cells: HTMLElement[][] = []
	private width = 0
	private height = 0

	constructor(mode: DomRenderMode = 'char') {
		this.mode = mode
	}

	init(width: number, height: number, tileSize: number): HTMLElement {
		this.width = width
		this.height = height

		const container = document.createElement('div')
		container.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${width}, ${tileSize}px);
      grid-template-rows: repeat(${height}, ${tileSize}px);
      gap: 0;
      font-family: monospace;
      line-height: 1;
    `

		this.cells = []
		for (let y = 0; y < height; y++) {
			this.cells[y] = []
			for (let x = 0; x < width; x++) {
				const cell = document.createElement('div')
				cell.style.cssText = `
          width: ${tileSize}px;
          height: ${tileSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${Math.floor(tileSize * 0.6)}px;
          box-sizing: border-box;
          border: 1px solid oklch(18% 0 0);
          color: #fff;
          background: oklch(14% 0 0);
        `
				container.appendChild(cell)
				this.cells[y][x] = cell
			}
		}
		return container
	}

	clear(): void {
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				const cell = this.cells[y][x]
				cell.textContent = ''
				cell.style.background = 'oklch(14% 0 0)'
				cell.style.color = '#fff'
			}
		}
	}

	draw({ x, y, char, fg = '#fff', bg }: DrawOptions): void {
		const cell = this.cells[y]?.[x]
		if (!cell) return
		cell.textContent = this.mode === 'char' ? char : this.getTileId(char)
		cell.style.color = fg
		if (bg) cell.style.background = bg
	}

	// Hilfsfunktion: Zeichen → Tile-ID für den Map-Modus
	private getTileId(char: string): string {
		const map: Record<string, string> = {
			'.': '0',
			'#': '1',
			'+': '2/3',
			s: '4',
			'@': 'P',
			r: 'E',
			o: 'E',
			T: 'E',
			'!': 'i',
			'/': 'i',
			'*': 'i'
		}
		return map[char] ?? char
	}
}
