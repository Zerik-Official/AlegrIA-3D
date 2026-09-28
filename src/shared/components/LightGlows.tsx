/**
 * Cheap stand-ins for point lights: an additive halo around a light source
 * and a colored pool of light on the ground under it. Neither is lit nor
 * lights anything, so scenes can stay colorful with only a handful of real
 * lights — every real point light adds cost to every lit pixel on screen.
 * @module shared/components/LightGlows
 */

import { forwardRef, memo, useMemo } from 'react'
import * as THREE from 'three'

/** Side of the shared glow texture, in px. */
const GLOW_TEXTURE_SIZE = 128
/** Shared radial falloff texture, created on first use. */
let glowTexture: THREE.CanvasTexture | null = null

/**
 * @returns A white radial gradient fading to transparent well before the edge
 */
function getGlowTexture(): THREE.CanvasTexture {
  if (glowTexture) return glowTexture
  const canvas = document.createElement('canvas')
  canvas.width = GLOW_TEXTURE_SIZE
  canvas.height = GLOW_TEXTURE_SIZE
  const ctx = canvas.getContext('2d')!
  const half = GLOW_TEXTURE_SIZE / 2
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.12)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE)
  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}

/**
 * Props for {@link GlowSprite}.
 */
interface GlowSpriteProps {
  /** Halo color. */
  color: string
  /** Halo diameter, in scene units. */
  size: number
  /** Peak opacity. */
  opacity?: number
  /** Position of the halo's center. */
  position?: [number, number, number]
}

/**
 * Camera-facing additive halo around a light source.
 * @param props - Color, size, opacity and placement
 * @returns Halo sprite; its ref exposes the sprite so callers can pulse it
 */
export const GlowSprite = memo(
  forwardRef<THREE.Sprite, GlowSpriteProps>(function GlowSprite({ color, size, opacity = 0.55, position }, ref) {
    const map = useMemo(() => getGlowTexture(), [])
    return (
      <sprite ref={ref} position={position} scale={[size, size, 1]} raycast={() => null} userData={{ editorIgnore: true }}>
        <spriteMaterial map={map} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
    )
  })
)

/**
 * Props for {@link GroundGlow}.
 */
interface GroundGlowProps {
  /** Pool color. */
  color: string
  /** Pool radius, in scene units. */
  radius: number
  /** Peak opacity. */
  opacity?: number
  /** Position of the pool's center, a hair above the floor. */
  position?: [number, number, number]
}

/**
 * Additive pool of colored light lying flat on the floor.
 * @param props - Color, radius, opacity and placement
 * @returns Floor decal; its ref exposes the mesh so callers can pulse it
 */
export const GroundGlow = memo(
  forwardRef<THREE.Mesh, GroundGlowProps>(function GroundGlow({ color, radius, opacity = 0.35, position = [0, 0.03, 0] }, ref) {
    const map = useMemo(() => getGlowTexture(), [])
    return (
      <mesh ref={ref} position={position} rotation-x={-Math.PI / 2} renderOrder={1} raycast={() => null} userData={{ editorIgnore: true }}>
        <planeGeometry args={[radius * 2, radius * 2]} />
        <meshBasicMaterial map={map} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    )
  })
)
