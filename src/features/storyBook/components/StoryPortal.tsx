import { memo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ProceduralPortal } from '@/shared/components/ReusableModels'
import { PortalOpening } from '@/shared/components/PortalOpening'
import { getCollisionSolids } from '@/features/player/collision'
import { playerConfig } from '@/shared/config/appConfig'
import type { Bounds } from '@/shared/types'
import type { PortalPlacement } from '@/app/hooks/useStoryBookFlow'

/**
 * Props for {@link StoryPortal}.
 */
interface StoryPortalProps {
  /** Whether the portal should open; it is placed once, the first frame this turns true. */
  active: boolean
  /** Reports where the portal was placed, so proximity can find it and the crossing cinematic can dive into it. */
  onPlaced: (placement: PortalPlacement) => void
  /** Movement bounds of the current phase — the portal never opens outside them. */
  bounds?: Bounds
  /** Ground-level circles the player can't enter (e.g. Phase 2's landmark footprints). */
  obstacles?: Array<{ x: number; z: number; radius: number }>
  /** Warm accent color for the ring. */
  accentColor?: string
  /** Cool glow color for the vortex. */
  glowColor?: string
}

/** Distances in front of the player tried, farthest first, when looking for open ground. */
const CANDIDATE_DISTANCES = [4.2, 3.6, 3, 2.4] as const
/** Clearance the portal's footprint needs from walls and obstacles. */
const PORTAL_CLEARANCE = 0.9
/** Height of the portal's center above the floor. */
const PORTAL_CENTER_Y = 1.35

/**
 * @param x - Candidate world X
 * @param z - Candidate world Z
 * @param floorY - Floor height the player stands on
 * @param obstacles - Extra blocking circles
 * @returns Whether a standing obstacle occupies `(x, z)`
 */
function isBlocked(x: number, z: number, floorY: number, obstacles: StoryPortalProps['obstacles']): boolean {
  for (const solid of getCollisionSolids()) {
    if (solid.maxY <= floorY + playerConfig.stepUpHeight || solid.minY > floorY + playerConfig.bodyHeight) continue
    if (x > solid.minX - PORTAL_CLEARANCE && x < solid.maxX + PORTAL_CLEARANCE && z > solid.minZ - PORTAL_CLEARANCE && z < solid.maxZ + PORTAL_CLEARANCE) return true
  }
  if (obstacles) for (const o of obstacles) if (Math.hypot(x - o.x, z - o.z) < o.radius + PORTAL_CLEARANCE) return true
  return false
}

/**
 * The portal the Libro de Rosa summons in the open phases: opened directly in
 * front of wherever the player is looking, facing them, on the nearest open
 * ground along that line (so it never sinks into a wall), tearing open as a rift
 * of light (see `PortalOpening`) instead of popping into existence.
 *
 * @param props - Activation, placement constraints and colors
 * @returns Portal group, or `null` until opened
 */
export const StoryPortal = memo(function StoryPortal({ active, onPlaced, bounds, obstacles, accentColor = '#ffcc33', glowColor = '#5ad8ff' }: StoryPortalProps) {
  const { camera } = useThree()
  const [placement, setPlacement] = useState<PortalPlacement | null>(null)
  useFrame(() => {
    if (!active) {
      if (placement) setPlacement(null)
      return
    }
    if (!placement) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      forward.y = 0
      if (forward.lengthSq() < 1e-4) forward.set(0, 0, -1)
      forward.normalize()
      const floorY = camera.position.y - playerConfig.eyeHeight
      let chosen: [number, number] | null = null
      for (const d of CANDIDATE_DISTANCES) {
        let x = camera.position.x + forward.x * d
        let z = camera.position.z + forward.z * d
        if (bounds) {
          x = THREE.MathUtils.clamp(x, bounds.minX, bounds.maxX)
          z = THREE.MathUtils.clamp(z, bounds.minZ, bounds.maxZ)
        }
        if (!isBlocked(x, z, floorY, obstacles)) {
          chosen = [x, z]
          break
        }
      }
      const last = CANDIDATE_DISTANCES[CANDIDATE_DISTANCES.length - 1]
      const [x, z] = chosen ?? [camera.position.x + forward.x * last, camera.position.z + forward.z * last]
      const yaw = Math.atan2(camera.position.x - x, camera.position.z - z)
      const next: PortalPlacement = { position: [x, floorY + PORTAL_CENTER_Y, z], yaw }
      setPlacement(next)
      onPlaced(next)
    }
  })

  if (!active || !placement) return null

  return (
    <group position={placement.position} rotation-y={placement.yaw}>
      <PortalOpening radius={1.45} accentColor={accentColor} glowColor={glowColor}>
        <ProceduralPortal position={[0, 0, 0]} radius={1.45} accentColor={accentColor} glowColor={glowColor} />
      </PortalOpening>
    </group>
  )
})
