/**
 * Mobiliario urbano de la calle abajera 2050 — la "cultura de bordillo" en
 * vez de bancas metálicas aisladas: el andén alto con su bordillo amarillo
 * desgastado (donde la gente se sienta) y los robles amarillos con polen
 * resplandeciente.
 * @module features/cityIntro/renderers/AbajeroStreetProps
 */

import { useMemo } from 'react'
import { Sparkles } from '@react-three/drei'
import { createSeededRandom, hashSeed } from '@/shared/utils/random'
import { FLORA_GREEN, ROBLE_BLOOM, SOLAR_YELLOW } from '@/features/cityIntro/config/colorPalette'
import type { EntityRendererProps } from '@/engine/types'

/** Alto del andén sobre la calzada. */
const CURB_H = 0.34
/** Fondo (profundidad) del andén desde el filo del bordillo. */
const CURB_DEPTH = 2.1

/**
 * Tramo de andén con bordillo amarillo. El largo llega en `entity.variant`
 * (número en unidades de mundo, por defecto 6) y las manchas de desgaste se
 * siembran del `id`, así que dos tramos contiguos no se ven calcados.
 * @param props - Entity props
 * @returns Tramo de andén
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
 * Roble amarillo en flor con polen luminiscente. Es el relevo vegetal de las
 * macetas de neón: la misma función de acento luminoso, pero con la flora del
 * barrio (roble / matarratón).
 * @param props - Entity props
 * @returns Árbol con partículas
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
      <pointLight position={[0, canopy.height + 0.3, 0]} intensity={0.9} distance={6} decay={2} color={bloom} />
    </group>
  )
}
