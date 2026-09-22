/**
 * Runtime-generated (canvas-based) textures shared by procedural ground/water
 * dressing, so no external image assets are needed for soft edges or foliage cutouts.
 * @module shared/utils/textures
 */

import * as THREE from 'three'

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
