/**
 * Urban furniture for the 2050 abajera street — "curb culture" instead of
 * isolated metal benches: a raised sidewalk with a worn yellow curb (where
 * people sit) and yellow oaks with glowing pollen.
 * @module features/cityIntro/renderers/AbajeroStreetProps
 */

import { useMemo } from 'react'
import { Sparkles } from '@react-three/drei'
import { createSeededRandom, hashSeed } from '@/shared/utils/random'
import { FLORA_GREEN, ROBLE_BLOOM, SOLAR_YELLOW } from '@/features/cityIntro/config/colorPalette'
import type { EntityRendererProps } from '@/engine/types'
import { GroundGlow } from '@/shared/components/LightGlows'

/** Height of the sidewalk above the roadway. */
const CURB_H = 0.34
/** Sidewalk depth from the curb edge. */
const CURB_DEPTH = 2.1

/**
 * Sidewalk segment with a yellow curb. Its length comes from `entity.variant`
 * (a number in world units, defaulting to 6), and wear patches are seeded from
 * the `id`, so adjacent segments do not look identical.
 * @param props - Entity props
 * @returns Sidewalk segment
 */
export function CurbRenderer({ entity }: EntityRendererProps) {
  const length = Number.parseFloat(entity.variant ?? '') || 6

  const wear = useMemo(() => {
    const rand = createSeededRandom(hashSeed(entity.id))
    return Array.from({ length: 5 }, () => ({
      z: (rand() - 0.5) * length * 0.9,
      w: 0.25 + rand() * 0.7,
      dark: rand() > 0.5,
    }))
  }, [entity.id, length])

  return (
    <group>
      <mesh position={[0, CURB_H / 2, 0]} receiveShadow>
        <boxGeometry args={[CURB_DEPTH, CURB_H, length]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.95} />
      </mesh>

      <mesh position={[CURB_DEPTH / 2 + 0.03, CURB_H / 2, 0]}>
        <boxGeometry args={[0.06, CURB_H, length]} />
        <meshStandardMaterial color={SOLAR_YELLOW} emissive={SOLAR_YELLOW} emissiveIntensity={0.35} roughness={0.85} />
      </mesh>
      <mesh position={[CURB_DEPTH / 2 - 0.12, CURB_H + 0.01, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.24, length]} />
        <meshStandardMaterial color={SOLAR_YELLOW} emissive={SOLAR_YELLOW} emissiveIntensity={0.28} roughness={0.9} />
      </mesh>

      {wear.map((w, i) => (
        <mesh key={i} position={[CURB_DEPTH / 2 + 0.065, CURB_H * (w.dark ? 0.35 : 0.68), w.z]}>
          <boxGeometry args={[0.02, CURB_H * 0.4, w.w]} />
          <meshStandardMaterial color={w.dark ? '#5a4a3a' : '#c9a86a'} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Blooming yellow oak with luminous pollen. It replaces the neon planters as
 * the neighborhood's luminous accent, using local flora (oak / matarraton).
 * @param props - Entity props
 * @returns Tree with particles
 */
export function YellowTreeRenderer({ entity }: EntityRendererProps) {
  const bloom = entity.variant ?? ROBLE_BLOOM

  const canopy = useMemo(() => {
    const rand = createSeededRandom(hashSeed(entity.id))
    const height = 3.2 + rand() * 1.4
    return {
      height,
      blobs: Array.from({ length: 4 }, () => ({
        x: (rand() - 0.5) * 1.5,
        y: height + (rand() - 0.3) * 0.9,
        z: (rand() - 0.5) * 1.5,
        r: 0.75 + rand() * 0.55,
      })),
    }
  }, [entity.id])

  return (
    <group>
      <mesh position={[0, canopy.height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.22, canopy.height, 7]} />
        <meshStandardMaterial color="#4a3526" roughness={0.95} />
      </mesh>

      {canopy.blobs.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} castShadow>
          <icosahedronGeometry args={[b.r, 0]} />
          <meshStandardMaterial color={bloom} emissive={bloom} emissiveIntensity={0.45} roughness={0.9} flatShading />
        </mesh>
      ))}

      <mesh position={[0, canopy.height - 0.5, 0]} castShadow>
        <icosahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial color={FLORA_GREEN} roughness={0.95} flatShading />
      </mesh>

      <Sparkles count={26} scale={[3.4, 2.6, 3.4]} position={[0, canopy.height + 0.2, 0]} size={3.5} speed={0.35} color={bloom} />
      <GroundGlow color={bloom} radius={2.4} opacity={0.28} />
    </group>
  )
}
