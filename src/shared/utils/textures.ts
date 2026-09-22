/**
 * Runtime-generated (canvas-based) textures shared by procedural ground/water
 * dressing, so no external image assets are needed for soft edges or foliage cutouts.
 * @module shared/utils/textures
 */

import * as THREE from 'three'
import { createSeededRandom } from '@/shared/utils/random'

/**
 * Soft white-to-transparent radial gradient, used as an `alphaMap` to fade
 * the edges of a flat circular patch (mud, dirt, ...) without a hard cutout.
 * @param size - Texture size in pixels (square)
 * @returns Canvas-based alpha texture
 */
export function createSoftCircleTexture(size = 128): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.7)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Deterministic grid of lit/unlit windows, used as a night-facade texture for
 * skyscrapers. The same `seed` always produces the same pattern.
 * @param seed - Deterministic seed, e.g. from `hashSeed(entity.id)`
 * @param cols - Window columns
 * @param rows - Window rows
 * @returns Canvas-based window-grid texture
 */
export function createWindowGridTexture(seed: number, cols = 5, rows = 14): THREE.Texture {
  const cellSize = 8
  const w = cols * cellSize
  const h = rows * cellSize
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#05070c'
  ctx.fillRect(0, 0, w, h)

  const rand = createSeededRandom(seed)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = rand() > 0.45
      if (!lit) continue
      ctx.globalAlpha = 0.55 + rand() * 0.4
      ctx.fillStyle = rand() > 0.75 ? '#ffe27a' : '#8fd8ff'
      ctx.fillRect(c * cellSize + 1, r * cellSize + 1, cellSize - 2, cellSize - 2)
    }
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}
