import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CarnivalCrowd } from '@/features/cityIntro/components/carnival/CarnivalCrowd'
import { CarnivalPennants } from '@/features/cityIntro/components/carnival/CarnivalPennants'
import { CarnivalHolograms } from '@/features/cityIntro/components/carnival/CarnivalHolograms'
import { CarnivalStalls } from '@/features/cityIntro/components/carnival/CarnivalStalls'
import { CarnivalMusicSystem } from '@/features/cityIntro/components/carnival/CarnivalMusicSystem'
import { beatAt, PARTY_AREA } from '@/features/cityIntro/config/carnivalLayout'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link StreetCarnival}.
 */
interface StreetCarnivalProps {
  /** The walk's `path-point` entities, which the crowd leaves room for. */
  pathEntities: EditableEntity[]
}

/** Spacing of the pulsing lights hung over the avenue — wider than the party's tempo alone would suggest, to keep the number of realtime lights the scene pays for each frame down. */
const BEAT_LIGHT_STEP = 15

/**
 * Lights strung over the avenue that throb on the beat, alternating magenta
 * and amber, zig-zagging from one side to the other.
 * @returns Lights
 */
const BeatLights = memo(function BeatLights() {
  const refs = useRef<THREE.PointLight[]>([])
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
      const light = refs.current[i]
      if (light) light.intensity = 22 * (0.65 + 0.55 * Math.pow(0.5 + 0.5 * Math.cos(beat * Math.PI * 2 + l.phase), 3))
    })
  })

  return (
    <group>
      {lights.map((l, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el
          }}
          position={l.position}
          color={l.color}
          intensity={22}
          distance={18}
          decay={2}
        />
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
