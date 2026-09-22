/**
 * `path-point` entity renderer for the `cityIntro` scene — a subtle floating
 * guide light marking the scripted walk route, also used as the `CityWalkControls`
 * waypoints (see `App.tsx`).
 * @module features/cityIntro/renderers/PathPointRenderer
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Small hovering, pulsing marker so the walk path stays visible/selectable
 * in the editor without distracting during normal play.
 * @returns Renderer element
 */
export function PathPointRenderer() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = 0.15 + Math.sin(clock.elapsedTime * 1.4 + ref.current.position.x) * 0.05
  })
  return (
    <mesh ref={ref} position={[0, 0.15, 0]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color="#ffcc33" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}
