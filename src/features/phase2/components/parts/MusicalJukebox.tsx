/**
 * "El Poderoso" jukebox: the model vibrates to a beat while musical notes
 * float up from it and a soft ring pulses on the floor.
 * @module features/phase2/components/parts/MusicalJukebox
 */

import { memo, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Beats per second of the vibration (≈ 120 BPM). */
const BEAT_HZ = 2
/** Glyphs and colors the note sprites cycle through. */
const NOTE_GLYPHS = ['♪', '♫', '♩', '♬']
const NOTE_COLORS = ['#ffd23f', '#ff5d8f', '#4de1c1', '#ff9f1c', '#8ecbff']
const NOTE_COUNT = 9
/** Seconds one note takes to rise and fade out. */
const NOTE_LIFETIME = 4.2
/** Local-space height where notes spawn / vanish (model is normalized to ~1.6 tall). */
const NOTE_START_Y = 1.5
const NOTE_RISE = 2.4

/**
 * Draws one note glyph to a transparent canvas texture.
 * @param glyph - Musical symbol
 * @param color - Fill color
 * @returns Sprite texture
 */
function createNoteTexture(glyph: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.font = 'bold 104px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 8
  ctx.strokeStyle = 'rgba(20,10,0,0.85)'
  ctx.strokeText(glyph, 64, 68)
  ctx.fillStyle = color
  ctx.fillText(glyph, 64, 68)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Wraps a jukebox model with beat vibration, rising notes and a floor pulse.
 * @param props.children - The jukebox model
 * @returns Animated group
 */
export const MusicalJukebox = memo(function MusicalJukebox({ children }: { children: ReactNode }) {
  const bodyRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const noteRefs = useRef<Array<THREE.Sprite | null>>([])

  const textures = useMemo(() => NOTE_COLORS.map((c, i) => createNoteTexture(NOTE_GLYPHS[i % NOTE_GLYPHS.length], c)), [])
  const notes = useMemo(
    () =>
      Array.from({ length: NOTE_COUNT }, (_, i) => ({
        offset: i / NOTE_COUNT,
        angle: (i * 2.399) % (Math.PI * 2),
        sway: 0.25 + (i % 3) * 0.12,
        tex: textures[i % textures.length],
      })),
    [textures],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * BEAT_HZ)), 6)
    if (bodyRef.current) {
      const b = bodyRef.current
      b.scale.set(1 + beat * 0.018, 1 - beat * 0.022, 1 + beat * 0.018)
      b.position.x = Math.sin(t * 61) * 0.006 * (0.4 + beat)
      b.position.z = Math.cos(t * 53) * 0.006 * (0.4 + beat)
      b.rotation.z = Math.sin(t * 47) * 0.004 * (0.4 + beat)
    }
    if (ringRef.current) {
      const s = 1 + beat * 0.25
      ringRef.current.scale.set(s, s, s)
      ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + beat * 0.3
    }
    notes.forEach((n, i) => {
      const sprite = noteRefs.current[i]
      if (!sprite) return
      const p = (t / NOTE_LIFETIME + n.offset) % 1
      const wobble = Math.sin(p * Math.PI * 4 + n.angle) * n.sway
      sprite.position.set(Math.cos(n.angle) * (0.35 + p * 0.5) + wobble * 0.4, NOTE_START_Y + p * NOTE_RISE, Math.sin(n.angle) * (0.35 + p * 0.5) + wobble * 0.3)
      const fade = p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88
      ;(sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, fade)
      const size = 0.32 + 0.16 * Math.sin(p * Math.PI)
      sprite.scale.set(size, size, 1)
      ;(sprite.material as THREE.SpriteMaterial).rotation = Math.sin(p * 6 + n.angle) * 0.35
    })
  })

  return (
    <group>
      <group ref={bodyRef}>{children}</group>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} raycast={() => null}>
        <ringGeometry args={[0.7, 0.85, 40]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {notes.map((n, i) => (
        <sprite key={i} ref={(el) => (noteRefs.current[i] = el)} raycast={() => null}>
          <spriteMaterial map={n.tex} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  )
})
