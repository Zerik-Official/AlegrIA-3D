import { memo, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link RainStreaks}.
 */
interface RainStreaksProps {
  /** How many drops fall at full strength. */
  count: number
  /** Current rain strength `[0,1]`, eased by `PhaseRain`. */
  intensity: MutableRefObject<number>
}

/** Half extent of the box of rain kept around the player. */
const HALF_REACH = 24
/** Height the drops fall from and wrap back to. */
const TOP_Y = 22
/** Length of each drop's streak. */
const STREAK = 0.55
/** Sideways drift per unit fallen — a light wind from the river. */
const WIND = 0.12

/**
 * Falling rain: short streaks inside a box that follows the player, so the
 * downpour always surrounds them however far they walk. Drops beyond the
 * current intensity are parked out of sight, so the rain thickens gradually.
 *
 * @param props - Drop count and live intensity
 * @returns Line segments of falling drops
 */
export const RainStreaks = memo(function RainStreaks({ count, intensity }: RainStreaksProps) {
  const linesRef = useRef<THREE.LineSegments>(null)
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 6)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * HALF_REACH * 2
      const y = Math.random() * TOP_Y
      const z = (Math.random() - 0.5) * HALF_REACH * 2
      pos.set([x, y, z, x - WIND * STREAK, y - STREAK, z], i * 6)
      spd[i] = 16 + Math.random() * 8
    }
    return { positions: pos, speeds: spd }
  }, [count])

  useFrame(({ camera }, delta) => {
    const lines = linesRef.current
    if (!lines) return
    const dt = Math.min(delta, 0.05)
    lines.position.set(camera.position.x, 0, camera.position.z)
    const visible = Math.floor(count * intensity.current)
    const attr = lines.geometry.attributes.position as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      const o = i * 6
      if (i >= visible) {
        arr[o + 1] = -50
        arr[o + 4] = -50
        continue
      }
      let y = arr[o + 1] - speeds[i] * dt
      let x = arr[o] - WIND * speeds[i] * dt
      if (y < 0) {
        y += TOP_Y
        x = (Math.random() - 0.5) * HALF_REACH * 2
        arr[o + 2] = (Math.random() - 0.5) * HALF_REACH * 2
        arr[o + 5] = arr[o + 2]
      }
      arr[o] = x
      arr[o + 1] = y
      arr[o + 3] = x - WIND * STREAK
      arr[o + 4] = y - STREAK
    }
    attr.needsUpdate = true
    const mat = lines.material as THREE.LineBasicMaterial
    mat.opacity = 0.18 + intensity.current * 0.24
  })

  return (
    <lineSegments ref={linesRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#c8d8e8" transparent opacity={0.2} depthWrite={false} />
    </lineSegments>
  )
})
