/**
 * Canvas textures for the Digital Cultural Mural (`culture-mural`).
 * Draws Carnival of Barranquilla motifs (marimonda, garabato, and drums)
 * as neon line art over a dark background, ready for the mural shader
 * to project as a hologram.
 *
 * Canvas textures are used instead of images because the rest of the scene
 * already handles procedural textures this way (see `shared/utils/textures`):
 * no assets to version and colors taken directly from the phase palette.
 * @module features/cityIntro/renderers/muralTexture
 */

import * as THREE from 'three'
import { CARNAVAL_RED, NEON_CYAN, NEON_MAGENTA, SOLAR_YELLOW } from '@/features/cityIntro/config/colorPalette'

/** Carnival motifs that the mural can draw. */
export type MuralMotif = 'marimonda' | 'garabato' | 'tambores'

/** Size of one side of the mural's square canvas, in pixels. */
const SIZE = 512

/**
 * Strokes `path` twice: a wide translucent halo followed by the solid line,
 * making the drawing read as neon rather than a flat outline.
 * @param ctx - Mural 2D context
 * @param color - Neon color
 * @param width - Solid line width
 * @param path - Draws the shape; invoked twice
 */
function neonStroke(ctx: CanvasRenderingContext2D, color: string, width: number, path: () => void): void {
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.28
  ctx.lineWidth = width * 4
  path()
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.lineWidth = width
  path()
  ctx.stroke()
}

/**
 * Marimonda: a round face, bulging eyes, ears, and a hanging trunk.
 * @param ctx - Mural 2D context
 */
function drawMarimonda(ctx: CanvasRenderingContext2D): void {
  const cx = SIZE / 2
  const cy = SIZE * 0.42
  const r = SIZE * 0.22

  ctx.fillStyle = SOLAR_YELLOW
  ctx.globalAlpha = 0.16
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  neonStroke(ctx, SOLAR_YELLOW, 6, () => {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
  })

  for (const side of [-1, 1]) {
    neonStroke(ctx, NEON_MAGENTA, 5, () => {
      ctx.beginPath()
      ctx.ellipse(cx + side * r * 1.05, cy - r * 0.1, r * 0.34, r * 0.46, 0, 0, Math.PI * 2)
    })
    neonStroke(ctx, NEON_CYAN, 5, () => {
      ctx.beginPath()
      ctx.arc(cx + side * r * 0.42, cy - r * 0.26, r * 0.26, 0, Math.PI * 2)
    })
    ctx.fillStyle = NEON_CYAN
    ctx.beginPath()
    ctx.arc(cx + side * r * 0.42, cy - r * 0.24, r * 0.1, 0, Math.PI * 2)
    ctx.fill()
  }

  neonStroke(ctx, CARNAVAL_RED, 7, () => {
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.2, cy + r * 0.18)
    ctx.quadraticCurveTo(cx, cy + r * 0.34, cx + r * 0.2, cy + r * 0.18)
    ctx.lineTo(cx + r * 0.16, cy + r * 1.5)
    ctx.quadraticCurveTo(cx, cy + r * 1.78, cx - r * 0.16, cy + r * 1.5)
    ctx.closePath()
  })
}

/**
 * Garabato: a top hat, cape, and the raised garabato (curved sickle).
 * @param ctx - Mural 2D context
 */
function drawGarabato(ctx: CanvasRenderingContext2D): void {
  const cx = SIZE * 0.46
  const base = SIZE * 0.86

  neonStroke(ctx, SOLAR_YELLOW, 6, () => {
    ctx.beginPath()
    ctx.moveTo(cx - SIZE * 0.13, base)
    ctx.lineTo(cx - SIZE * 0.05, SIZE * 0.42)
    ctx.lineTo(cx + SIZE * 0.05, SIZE * 0.42)
    ctx.lineTo(cx + SIZE * 0.13, base)
    ctx.closePath()
  })

  neonStroke(ctx, CARNAVAL_RED, 5, () => {
    ctx.beginPath()
    ctx.arc(cx, SIZE * 0.35, SIZE * 0.055, 0, Math.PI * 2)
  })

  neonStroke(ctx, NEON_CYAN, 5, () => {
    ctx.beginPath()
    ctx.rect(cx - SIZE * 0.07, SIZE * 0.2, SIZE * 0.14, SIZE * 0.1)
    ctx.moveTo(cx - SIZE * 0.11, SIZE * 0.3)
    ctx.lineTo(cx + SIZE * 0.11, SIZE * 0.3)
  })

  neonStroke(ctx, NEON_MAGENTA, 6, () => {
    ctx.beginPath()
    ctx.moveTo(cx + SIZE * 0.08, SIZE * 0.62)
    ctx.lineTo(cx + SIZE * 0.26, SIZE * 0.34)
    ctx.quadraticCurveTo(cx + SIZE * 0.4, SIZE * 0.24, cx + SIZE * 0.3, SIZE * 0.16)
  })

  for (let i = 0; i < 4; i++) {
    neonStroke(ctx, i % 2 === 0 ? NEON_MAGENTA : SOLAR_YELLOW, 3, () => {
      const y = SIZE * 0.5 + i * SIZE * 0.09
      ctx.beginPath()
      ctx.moveTo(cx - SIZE * 0.1 - i * 4, y)
      ctx.lineTo(cx + SIZE * 0.1 + i * 4, y)
    })
  }
}

/**
 * Drums: a tambora and two alegre drums with heads and stretched-leather
 * zigzags.
 * @param ctx - Mural 2D context
 */
function drawTambores(ctx: CanvasRenderingContext2D): void {
  const drums: Array<[number, number, number, number, string]> = [
    [SIZE * 0.28, SIZE * 0.62, SIZE * 0.13, SIZE * 0.3, CARNAVAL_RED],
    [SIZE * 0.54, SIZE * 0.56, SIZE * 0.17, SIZE * 0.38, SOLAR_YELLOW],
    [SIZE * 0.78, SIZE * 0.64, SIZE * 0.11, SIZE * 0.26, NEON_CYAN],
  ]

  for (const [cx, cy, rx, h, color] of drums) {
    neonStroke(ctx, color, 5, () => {
      ctx.beginPath()
      ctx.ellipse(cx, cy - h / 2, rx, rx * 0.34, 0, 0, Math.PI * 2)
    })
    neonStroke(ctx, color, 5, () => {
      ctx.beginPath()
      ctx.moveTo(cx - rx, cy - h / 2)
      ctx.lineTo(cx - rx * 0.78, cy + h / 2)
      ctx.moveTo(cx + rx, cy - h / 2)
      ctx.lineTo(cx + rx * 0.78, cy + h / 2)
      ctx.moveTo(cx - rx * 0.78, cy + h / 2)
      ctx.quadraticCurveTo(cx, cy + h / 2 + rx * 0.3, cx + rx * 0.78, cy + h / 2)
    })
    neonStroke(ctx, NEON_MAGENTA, 3, () => {
      ctx.beginPath()
      for (let i = 0; i <= 6; i++) {
        const x = cx - rx + (i / 6) * rx * 2
        const y = cy - h * 0.16 + (i % 2 === 0 ? -h * 0.08 : h * 0.08)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    })
  }
}

/** Motif painters; add a new motif by registering its function here. */
const MOTIF_PAINTERS: Record<MuralMotif, (ctx: CanvasRenderingContext2D) => void> = {
  marimonda: drawMarimonda,
  garabato: drawGarabato,
  tambores: drawTambores,
}

/**
 * Generates the mural texture for a Carnival motif.
 * @param motif - Motif to draw; unknown values fall back to marimonda
 * @returns Canvas texture ready for the mural shader
 */
export function createMuralTexture(motif: string | undefined): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#0a0410'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const paint = MOTIF_PAINTERS[(motif as MuralMotif) ?? 'marimonda'] ?? MOTIF_PAINTERS.marimonda
  paint(ctx)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
