/**
 * A floating name label over a credits performer's head — a camera-facing
 * sprite drawn once to a canvas texture, the same technique
 * `MusicalJukebox`'s note glyphs use. The canvas is sized to the text, so
 * long names are never clipped.
 * @module features/credits/components/NameTag
 */

import { memo, useEffect, useMemo } from 'react'
import * as THREE from 'three'

/** Props for {@link NameTag}. */
interface NameTagProps {
  /** Label text. */
  text: string
  /** World position of the tag's center. */
  position: [number, number, number]
  /** World-unit height of the sprite; its width follows the text's length. */
  height?: number
}

/** Canvas height of the label, in px. */
const CANVAS_HEIGHT = 128
/** Label font. */
const FONT = '600 56px Georgia, serif'
/** Horizontal room left for the glow around the text, in px. */
const PADDING_X = 64

/**
 * @param text - Label text
 * @returns Canvas texture of the label, with a soft gold glow, and its aspect ratio
 */
function createNameTexture(text: string): { texture: THREE.CanvasTexture; aspect: number } {
  const canvas = document.createElement('canvas')
  const measure = canvas.getContext('2d')!
  measure.font = FONT
  canvas.width = Math.ceil(measure.measureText(text).width + PADDING_X * 2)
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#ffd27a'
  ctx.shadowBlur = 22
  ctx.fillStyle = '#fff3d8'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return { texture, aspect: canvas.width / canvas.height }
}

/**
 * @param props - Text, placement and height
 * @returns Billboard sprite
 */
export const NameTag = memo(function NameTag({ text, position, height = 0.45 }: NameTagProps) {
  const { texture, aspect } = useMemo(() => createNameTexture(text), [text])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} raycast={() => null}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
})
