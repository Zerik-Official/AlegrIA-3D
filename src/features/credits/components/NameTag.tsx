/**
 * A floating name label over a credits performer's head — a camera-facing
 * sprite drawn once to a canvas texture, the same technique
 * `MusicalJukebox`'s note glyphs use.
 * @module features/credits/components/NameTag
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'

/** Props for {@link NameTag}. */
interface NameTagProps {
  /** Label text. */
  text: string
  /** World position of the tag's center. */
  position: [number, number, number]
  /** World-unit width of the sprite (height follows the canvas's aspect ratio). */
  width?: number
}

/**
 * @param text - Label text
 * @returns Canvas texture of the label, with a soft gold glow
 */
function createNameTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.font = '600 56px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#ffd27a'
  ctx.shadowBlur = 22
  ctx.fillStyle = '#fff3d8'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  ctx.shadowBlur = 0
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * @param props - Text and placement
 * @returns Billboard sprite
 */
export const NameTag = memo(function NameTag({ text, position, width = 1.8 }: NameTagProps) {
  const texture = useMemo(() => createNameTexture(text), [text])
  const height = width / 4
  return (
    <sprite position={position} scale={[width, height, 1]} raycast={() => null}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
})
