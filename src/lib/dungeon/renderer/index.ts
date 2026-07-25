import { RotRenderer } from './RotRenderer'
import { DomRenderer } from './DomRenderer.svelte.ts'
import type { IRenderer } from './types'

// ← Hier tauschen:
// export const renderer: IRenderer = new RotRenderer()
export const renderer1: IRenderer = new DomRenderer('char')
export const renderer: IRenderer = new DomRenderer('map')
