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

/**
 * Deterministic banded planet surface (gas-giant style stripes + a couple of
 * storm blotches), tinted from a base color. The same `seed` always produces
 * the same surface.
 * @param seed - Deterministic seed, e.g. from `hashSeed(entity.id)`
 * @param baseColor - Base hue for the bands/storms
 * @returns Canvas-based equirectangular-ish surface texture
 */
export function createPlanetTexture(seed: number, baseColor: string): THREE.Texture {
  const w = 256
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const rand = createSeededRandom(seed)
  const base = new THREE.Color(baseColor)

  ctx.fillStyle = `#${base.getHexString()}`
  ctx.fillRect(0, 0, w, h)

  const bandCount = 6 + Math.floor(rand() * 5)
  for (let i = 0; i < bandCount; i++) {
    const y = (i / bandCount) * h
    const bandHeight = (h / bandCount) * (0.5 + rand())
    const shade = base.clone().offsetHSL(0, (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.22)
    ctx.globalAlpha = 0.45 + rand() * 0.4
    ctx.fillStyle = `#${shade.getHexString()}`
    ctx.fillRect(0, y, w, bandHeight)
  }
  ctx.globalAlpha = 1

  const spotCount = 2 + Math.floor(rand() * 3)
  for (let i = 0; i < spotCount; i++) {
    const sx = rand() * w
    const sy = rand() * h
    const sr = 8 + rand() * 16
    const shade = base.clone().offsetHSL((rand() - 0.5) * 0.12, 0.12, (rand() - 0.5) * 0.24)
    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
    gradient.addColorStop(0, `#${shade.getHexString()}`)
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(sx, sy, sr, sr * 0.6, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

/**
 * Deterministic neon "advertisement" grid — a few saturated color blocks —
 * used as the fallback screen texture for `ad-tower` entities that don't
 * reference a video, and as their scrolling ticker band. `texture.offset.x`
 * can be animated per-frame for a marquee scroll without regenerating the canvas.
 * @param seed - Deterministic seed, e.g. from `hashSeed(entity.id)`
 * @param cols - Horizontal segments
 * @param rows - Vertical segments
 * @returns Canvas-based, horizontally repeating ad-screen texture
 */
export function createAdScreenTexture(seed: number, cols = 6, rows = 4): THREE.Texture {
  const cellSize = 32
  const w = cols * cellSize
  const h = rows * cellSize
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const rand = createSeededRandom(seed)
  const palette = ['#ff2a6d', '#2affe0', '#ffcf3d', '#8a5cff', '#ff7a3d']

  ctx.fillStyle = '#05030a'
  ctx.fillRect(0, 0, w, h)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() > 0.55) continue
      ctx.fillStyle = palette[Math.floor(rand() * palette.length)]
      ctx.globalAlpha = 0.65 + rand() * 0.35
      const pad = 2
      ctx.fillRect(c * cellSize + pad, r * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2)
    }
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

/**
 * Deterministic weathered-wall overlay: irregular water-stain streaks and
 * grime patches over a transparent background, meant to sit as an extra
 * layer above a flat-colored wall so it reads as neglected/abandoned.
 * @param seed - Deterministic seed
 * @param size - Texture size in pixels (square)
 * @returns Canvas-based grime alpha/color texture
 */
export function createWeatheredWallTexture(seed: number, size = 256): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = createSeededRandom(seed)

  ctx.clearRect(0, 0, size, size)

  const streaks = 10 + Math.floor(rand() * 10)
  for (let i = 0; i < streaks; i++) {
    const x = rand() * size
    const topY = rand() * size * 0.4
    const length = size * (0.3 + rand() * 0.6)
    const width = 4 + rand() * 14
    const gradient = ctx.createLinearGradient(x, topY, x, topY + length)
    gradient.addColorStop(0, `rgba(20,16,10,${0.05 + rand() * 0.12})`)
    gradient.addColorStop(1, 'rgba(20,16,10,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(x - width / 2, topY, width, length)
  }

  const patches = 8 + Math.floor(rand() * 8)
  for (let i = 0; i < patches; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = 8 + rand() * 26
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
    const dark = rand() > 0.5
    gradient.addColorStop(0, dark ? `rgba(12,10,8,${0.1 + rand() * 0.16})` : `rgba(160,150,120,${0.08 + rand() * 0.12})`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
