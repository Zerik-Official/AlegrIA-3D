/**
 * Canvas drawing helpers for the street party's neon signs and holograms.
 * @module features/cityIntro/components/carnival/neonCanvas
 */

import * as THREE from 'three'

/**
 * @param width - Canvas width in px
 * @param height - Canvas height in px
 * @param draw - Paints the canvas
 * @returns sRGB canvas texture of the drawing
 */
export function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  draw(ctx, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * Draws neon lettering: a wide colored glow, a tighter colored tube and a
 * near-white core.
 * @param ctx - Canvas context
 * @param text - Lettering
 * @param x - Anchor X
 * @param y - Center Y
 * @param size - Font size in px
 * @param color - Tube color
 * @param align - Horizontal alignment
 */
export function neonText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center'): void {
  ctx.font = `900 ${size}px "Arial Black", Archivo, system-ui, sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.shadowColor = color
  ctx.lineJoin = 'round'
  for (const [blur, alpha] of [
    [40, 0.6],
    [18, 0.8],
  ]) {
    ctx.shadowBlur = blur
    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.lineWidth = size * 0.12
    ctx.strokeText(text, x, y)
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 8
  ctx.fillStyle = '#fff8ec'
  ctx.fillText(text, x, y)
  ctx.shadowBlur = 0
}
