import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CarnivalCrowd } from '@/features/cityIntro/components/carnival/CarnivalCrowd'
import { CarnivalPennants } from '@/features/cityIntro/components/carnival/CarnivalPennants'
import { CarnivalHolograms } from '@/features/cityIntro/components/carnival/CarnivalHolograms'
import { CarnivalStalls } from '@/features/cityIntro/components/carnival/CarnivalStalls'
import { CarnivalMusicSystem } from '@/features/cityIntro/components/carnival/CarnivalMusicSystem'
import { beatAt, PARTY_AREA } from '@/features/cityIntro/config/carnivalLayout'
import { GlowSprite, GroundGlow } from '@/shared/components/LightGlows'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link StreetCarnival}.
 */
interface StreetCarnivalProps {
  /** The walk's `path-point` entities, which the crowd leaves room for. */
  pathEntities: EditableEntity[]
}

/** Spacing of the pulsing lights hung over the avenue. */
const BEAT_LIGHT_STEP = 15
/** Which of the beat lights are real point lights; the rest glow without lighting anything, to keep the scene's light count low. */
const REAL_BEAT_LIGHTS = new Set([1, 3])
/** Peak intensity of the real beat lights. */
const BEAT_LIGHT_INTENSITY = 26

/**
 * Lights strung over the avenue that throb on the beat, alternating magenta
 * and amber, zig-zagging from one side to the other. Only two are real
 * lights; every one of them throbs as a halo overhead and a pool of color on
 * the street, so the whole avenue keeps pulsing.
 * @returns Lights and glows
 */
const BeatLights = memo(function BeatLights() {
  const lightRefs = useRef<Array<THREE.PointLight | null>>([])
  const haloRefs = useRef<Array<THREE.Sprite | null>>([])
  const poolRefs = useRef<Array<THREE.Mesh | null>>([])
  const lights = useMemo(() => {
    const [, , minZ, maxZ] = PARTY_AREA
    const list: Array<{ position: [number, number, number]; color: string; phase: number }> = []
    for (let z = maxZ - 4, i = 0; z > minZ; z -= BEAT_LIGHT_STEP, i++) {
      list.push({ position: [((i % 3) - 1) * 2.5, 5, z], color: i % 2 ? '#FFB703' : '#FF007F', phase: i * 0.7 })
    }
    return list
  }, [])

  useFrame(({ clock }) => {
    const { beat } = beatAt(clock.elapsedTime)
    lights.forEach((l, i) => {
      const level = 0.65 + 0.55 * Math.pow(0.5 + 0.5 * Math.cos(beat * Math.PI * 2 + l.phase), 3)
      const light = lightRefs.current[i]
      if (light) light.intensity = BEAT_LIGHT_INTENSITY * level
      const halo = haloRefs.current[i]
      if (halo) (halo.material as THREE.SpriteMaterial).opacity = 0.35 * level
      const pool = poolRefs.current[i]
      if (pool) (pool.material as THREE.MeshBasicMaterial).opacity = 0.32 * level
    })
  })

  return (
    <group>
      {lights.map((l, i) => (
        <group key={i}>
          {REAL_BEAT_LIGHTS.has(i) && (
            <pointLight
              ref={(el) => {
                lightRefs.current[i] = el
              }}
              position={l.position}
              color={l.color}
              intensity={BEAT_LIGHT_INTENSITY}
              distance={22}
              decay={2}
            />
          )}
          <GlowSprite
            ref={(el) => {
              haloRefs.current[i] = el
            }}
            color={l.color}
            size={3.2}
            opacity={0.35}
            position={l.position}
          />
          <GroundGlow
            ref={(el) => {
              poolRefs.current[i] = el
            }}
            color={l.color}
            radius={5}
            opacity={0.32}
            position={[l.position[0], 0.03, l.position[2]]}
          />
        </group>
      ))}
    </group>
  )
})

/**
 * "Baila la Calle 2050": the street party filling the future city's main
 * avenue — a dancing crowd, electroluminescent pennant strings, suspended
 * holograms, food stalls with neon signs and lights throbbing on the beat.
 * Everything moves to one tempo (`CARNIVAL_BPM`).
 *
 * @param props - Walk path
 * @returns Party group
 */
export const StreetCarnival = memo(function StreetCarnival({ pathEntities }: StreetCarnivalProps) {
  return (
    <group>
      <CarnivalCrowd pathEntities={pathEntities} />
      <CarnivalPennants />
      <CarnivalHolograms />
      <CarnivalStalls />
      <BeatLights />
      <CarnivalMusicSystem />
    </group>
  )
})
