/**
 * Camera lens flare for a bright light source: a glow and a halo ring on the
 * source, plus a trail of ghost discs and rings across the screen when the
 * source is in view. Uses three's `Lensflare`, which hides itself when the
 * source is off-screen or blocked by opaque geometry.
 * @module shared/components/SunLensFlare
 */

import { memo, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'

/** Reusable scratch vectors for the per-frame clearance offset. */
const scratch = {
  origin: new THREE.Vector3(),
  toCamera: new THREE.Vector3(),
  scale: new THREE.Vector3(),
}

/** Side of every generated flare texture, in pixels. */
const TEXTURE_SIZE = 256

/**
 * Draws a flare texture on a canvas.
 * @param paint - Paints the texture's alpha shape in white on the given context
 * @returns Canvas texture
 */
function createFlareTexture(paint: (ctx: CanvasRenderingContext2D, center: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const ctx = canvas.getContext('2d')
  if (ctx) paint(ctx, TEXTURE_SIZE / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * @returns Soft radial glow texture
 */
function createGlowTexture(): THREE.CanvasTexture {
  return createFlareTexture((ctx, center) => {
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.18, 'rgba(255,255,255,0.75)')
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.18)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  })
}

/**
 * @returns Thin luminous ring texture
 */
function createRingTexture(): THREE.CanvasTexture {
  return createFlareTexture((ctx, center) => {
    const gradient = ctx.createRadialGradient(center, center, center * 0.62, center, center, center)
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.55)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  })
}

/**
 * @returns Faint hexagonal ghost texture, like an aperture blade reflection
 */
function createGhostTexture(): THREE.CanvasTexture {
  return createFlareTexture((ctx, center) => {
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(255,255,255,0.28)')
    gradient.addColorStop(0.8, 'rgba(255,255,255,0.4)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6
      const x = center + Math.cos(angle) * center * 0.96
      const y = center + Math.sin(angle) * center * 0.96
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  })
}

/**
 * Props for {@link SunLensFlare}.
 */
interface SunLensFlareProps {
  /** Tint of the glow and the ghosts. */
  color?: string
  /** Multiplier on every element's on-screen size. */
  size?: number
  /**
   * Distance, in the parent's local units, the flare's anchor is pushed
   * towards the camera — past an opaque disc drawn at the same center, which
   * would otherwise fail the flare's occlusion test.
   */
  clearance?: number
}

/**
 * Place inside the light source's group, at its center.
 * @param props - Flare tint and size
 * @returns Lens flare object, ignored by the editor's spawn raycast
 */
export const SunLensFlare = memo(function SunLensFlare({ color = '#ffd9a0', size = 1, clearance = 0 }: SunLensFlareProps) {
  const textures = useMemo(() => ({ glow: createGlowTexture(), ring: createRingTexture(), ghost: createGhostTexture() }), [])

  const flare = useMemo(() => {
    const tint = new THREE.Color(color)
    const warm = tint.clone().lerp(new THREE.Color('#ff9a4a'), 0.35)
    const cool = tint.clone().lerp(new THREE.Color('#8ac8ff'), 0.55)
    const lensflare = new Lensflare()
    lensflare.userData.editorIgnore = true
    lensflare.addElement(new LensflareElement(textures.glow, 520 * size, 0, tint))
    lensflare.addElement(new LensflareElement(textures.ring, 300 * size, 0, warm))
    lensflare.addElement(new LensflareElement(textures.ghost, 60 * size, 0.42, cool))
    lensflare.addElement(new LensflareElement(textures.ring, 150 * size, 0.55, tint))
    lensflare.addElement(new LensflareElement(textures.ghost, 90 * size, 0.7, warm))
    lensflare.addElement(new LensflareElement(textures.ghost, 45 * size, 0.82, cool))
    lensflare.addElement(new LensflareElement(textures.ring, 240 * size, 1, cool))
    lensflare.addElement(new LensflareElement(textures.ghost, 120 * size, 1.15, warm))
    return lensflare
  }, [textures, color, size])

  useEffect(() => () => flare.dispose(), [flare])

  useFrame(({ camera }) => {
    const parent = flare.parent
    if (!parent || clearance <= 0) return
    parent.getWorldPosition(scratch.origin)
    parent.getWorldScale(scratch.scale)
    scratch.toCamera.copy(camera.position).sub(scratch.origin).normalize().multiplyScalar(clearance * scratch.scale.x)
    flare.position.copy(parent.worldToLocal(scratch.origin.add(scratch.toCamera)))
  })

  useEffect(
    () => () => {
      textures.glow.dispose()
      textures.ring.dispose()
      textures.ghost.dispose()
    },
    [textures]
  )

  return <primitive object={flare} />
})