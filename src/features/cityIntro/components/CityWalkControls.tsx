import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link CityWalkControls}.
 */
interface CityWalkControlsProps {
  /** Whether the scripted walk is active. */
  enabled: boolean
  /** `path-point` entities defining the route; sorted here by their `variant` order index. */
  pathEntities: EditableEntity[]
  /** Constant forward speed along the path, in units per second. */
  speed: number
  /** Camera height above each path point. */
  eyeHeight: number
  /** Called every frame with arc-length progress in [0,1]. */
  onProgress: (progress: number) => void
}

/**
 * Rail-walk camera for the city intro: position is driven by a Catmull-Rom
 * spline through the scene's `path-point` entities (constant speed via
 * arc-length parametrization), while `PointerLockControls` independently
 * handles mouse-look — mirroring how `PlayerControls` layers WASD position
 * updates under the same look mechanism. The player can only look around,
 * never steer, matching the "solo podrá acomodar la cámara" brief.
 *
 * @param props - Walk configuration
 * @returns `PointerLockControls` element
 */
export function CityWalkControls({ enabled, pathEntities, speed, eyeHeight, onProgress }: CityWalkControlsProps) {
  const { camera } = useThree()
  const distanceTraveled = useRef(0)
  const hasPositioned = useRef(false)

  const curve = useMemo(() => {
    const sorted = [...pathEntities].sort((a, b) => (parseFloat(a.variant ?? '0') || 0) - (parseFloat(b.variant ?? '0') || 0))
    if (sorted.length < 2) return null
    const points = sorted.map((e) => new THREE.Vector3(e.position[0], e.position[1], e.position[2]))
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3)
  }, [pathEntities])

  useEffect(() => {
    if (!enabled) {
      hasPositioned.current = false
      distanceTraveled.current = 0
    }
  }, [enabled])

  useFrame((_, delta) => {
    if (!enabled || !curve) return
    const length = curve.getLength()
    if (length <= 0) return

    if (!hasPositioned.current) {
      hasPositioned.current = true
      const start = curve.getPointAt(0)
      camera.position.set(start.x, start.y + eyeHeight, start.z)
      const aim = curve.getPointAt(Math.min(0.03, 1))
      camera.lookAt(aim.x, start.y + eyeHeight, aim.z)
    }

    if (distanceTraveled.current < length) {
      distanceTraveled.current = Math.min(distanceTraveled.current + speed * Math.min(delta, 0.05), length)
      const u = distanceTraveled.current / length
      const point = curve.getPointAt(u)
      camera.position.set(point.x, point.y + eyeHeight, point.z)
      onProgress(u)
    }
  })

  return <PointerLockControls enabled={enabled} />
}
