/**
 * The screen hovering over the concert stage, tilted down at the crowd,
 * showing a live equalizer of the street party's music (or a synthetic one
 * while it can't be analysed).
 * @module features/cityIntro/renderers/concert/FlyingEqualizerScreen
 */

import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { readAudioLevels } from '@/shared/audio/audioAnalyser'
import { GlowSprite } from '@/shared/components/LightGlows'

/** Canvas resolution of the screen. */
const CANVAS_W = 512
const CANVAS_H = 256
/** Equalizer bands drawn. */
const BANDS = 32
/** Screen size, in scene units. */
const SCREEN_W = 7.2
const SCREEN_H = 3.6

/**
 * Props for {@link FlyingEqualizerScreen}.
 */
interface FlyingEqualizerScreenProps {
  /** Hover position. */
  position: [number, number, number]
  /** Downward tilt, in radians. */
  tilt: number
}

/**
 * @param props - Placement and tilt
 * @returns Screen group
 */
export const FlyingEqualizerScreen = memo(function FlyingEqualizerScreen({ position, tilt }: FlyingEqualizerScreenProps) {
  const groupRef = useRef<THREE.Group>(null)
  const screenRef = useRef<THREE.Mesh>(null)
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = CANVAS_W
    c.height = CANVAS_H
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [canvas])
  const gradient = useMemo(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const g = ctx.createLinearGradient(0, CANVAS_H, 0, 0)
    g.addColorStop(0, '#ff007f')
    g.addColorStop(0.55, '#ffb703')
    g.addColorStop(1, '#49e9ff')
    return g
  }, [canvas])
  const stateRef = useRef({ levels: new Float32Array(BANDS), smoothed: new Float32Array(BANDS), peaks: new Float32Array(BANDS) })

  useEffect(() => () => texture.dispose(), [texture])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const group = groupRef.current
    if (group) {
      group.position.y = position[1] + Math.sin(t * 0.9) * 0.18
      group.rotation.z = Math.sin(t * 0.6) * 0.02
    }
    const ctx = canvas.getContext('2d')
    const screen = screenRef.current
    if (!ctx || !gradient || !screen) return
    const state = stateRef.current
    const live = readAudioLevels('carnival', state.levels)
    ctx.fillStyle = 'rgba(8, 4, 20, 0.55)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    const barW = CANVAS_W / BANDS
    for (let i = 0; i < BANDS; i++) {
      const target = live ? state.levels[i] : 0.3 + 0.25 * Math.sin(t * (2.2 + (i % 6) * 0.3) + i * 0.7) + 0.15 * Math.sin(t * 6.1 + i)
      state.smoothed[i] += (target - state.smoothed[i]) * 0.4
      state.peaks[i] = Math.max(state.smoothed[i], state.peaks[i] - 0.012)
      const h = Math.max(0.04, Math.min(1, state.smoothed[i])) * (CANVAS_H - 20)
      ctx.fillStyle = gradient
      ctx.fillRect(i * barW + 2, CANVAS_H - h, barW - 4, h)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(i * barW + 2, CANVAS_H - Math.min(1, state.peaks[i]) * (CANVAS_H - 20) - 6, barW - 4, 3)
    }
    const material = screen.material as THREE.MeshBasicMaterial
    if (material.map) material.map.needsUpdate = true
  })

  return (
    <group ref={groupRef} position={position}>
      <group rotation-x={tilt}>
        <mesh>
          <boxGeometry args={[SCREEN_W + 0.3, SCREEN_H + 0.3, 0.18]} />
          <meshStandardMaterial color="#0c0f18" metalness={0.7} roughness={0.35} emissive="#a855ff" emissiveIntensity={0.25} />
        </mesh>
        <mesh ref={screenRef} position={[0, 0, 0.1]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {[-1, 1].map((sx) =>
          [-1, 1].map((sy) => <GlowSprite key={`${sx}${sy}`} color="#49e9ff" size={1.1} opacity={0.6} position={[sx * (SCREEN_W / 2 + 0.2), sy * (SCREEN_H / 2 + 0.2), -0.2]} />)
        )}
      </group>
    </group>
  )
})
