/**
 * `flight-lane-point` entity renderer for the `cityIntro` scene — a subtle
 * floating marker for a flying-car/flying-train lane waypoint (see
 * `features/cityIntro/renderers/flightLane`), kept visible/selectable in the
 * editor without distracting during normal play.
 * @module features/cityIntro/renderers/FlightLanePointRenderer
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Small hovering, pulsing marker so a flight lane stays visible/selectable
 * in the editor.
 * @returns Renderer element
 */
export function FlightLanePointRenderer() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = 1 + Math.sin(clock.elapsedTime * 2 + ref.current.position.x) * 0.15
    ref.current.scale.setScalar(pulse)
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="#c97aff" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}
