/**
 * Port/river boats: the steamboat patrols a lane along the Río Magdalena at
 * constant arc-length speed (ping-ponging along the open curve, since the
 * river isn't a closed loop), while moored boats (canoe, chalupa) just bob
 * and sway gently in place. Both ride the same water-surface bob, decoupled
 * from `ArroyoWater`'s shader so they don't need a render-order dependency
 * on it.
 * @module features/phase1/components/parts/PuertoBoat
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { buildMagdalenaCurve, MAGDALENA_WATER_Y } from '@/features/phase1/components/parts/MagdalenaRiver'

/**
 * The steamboat `.glb` is authored bow-toward local `-X` rather than `+X`,
 * so aligning local `+X` with the direction of travel (as the raw tangent
 * heading below does) puts the stern forward. Rotating the hull an extra
 * half-turn corrects it to bow-first without touching the tangent/lane math.
 */
const HULL_FACING_OFFSET = Math.PI

/** Props for {@link PuertoBoat}. */
interface PuertoBoatProps {
  /** Public URL to the boat `.glb`. */
  src: string
  /** Fallback rendered when the asset cannot be loaded. */
  fallback: React.ReactNode
  /** Deterministic float in `[0, 1)` — paces the bob/sway so boats don't move in lockstep. */
  seed: number
  /** When set, the boat patrols the Río Magdalena at this offset from its centerline (positive = town side) instead of staying moored. */
  patrol?: { offset: number; speed: number }
}

/**
 * @param props - Model source, fallback and motion params
 * @returns Bobbing (and optionally river-patrolling) boat group
 */
export function PuertoBoat({ src, fallback, seed, patrol }: PuertoBoatProps) {
  const groupRef = useRef<THREE.Group>(null)
  const curve = useMemo(() => (patrol ? buildMagdalenaCurve() : null), [patrol])
  const curveLength = useMemo(() => curve?.getLength() ?? 0, [curve])
  const phase = seed * 30

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const t = clock.elapsedTime + phase
    const bob = Math.sin(t * 0.9) * 0.08
    const sway = Math.sin(t * 0.6) * 0.04

    if (curve && patrol) {
      const rawU = (clock.elapsedTime * patrol.speed) / curveLength
      const u = 1 - Math.abs((rawU % 2) - 1)
      const point = curve.getPointAt(THREE.MathUtils.clamp(u, 0, 1))
      const tangent = curve.getTangentAt(THREE.MathUtils.clamp(u, 0, 1))
      const forward = rawU % 2 < 1 ? 1 : -1
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
      group.position.set(point.x + normal.x * patrol.offset, MAGDALENA_WATER_Y + bob, point.z + normal.z * patrol.offset)
      group.rotation.y = Math.atan2(tangent.z * forward, tangent.x * forward) + HULL_FACING_OFFSET
    } else {
      group.position.y = bob
    }
    group.rotation.z = sway
    group.rotation.x = Math.sin(t * 0.5 + 1.4) * 0.025
  })

  return (
    <group ref={groupRef}>
      <ModelLoader src={src} fallback={fallback} />
    </group>
  )
}
