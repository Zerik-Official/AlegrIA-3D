/**
 * Industrial cone lamp hanging from the library ceiling on a cable: the shade,
 * a visible additive shaft of light under it, and a point light — with an
 * optional failing-ballast stutter.
 *
 * The shaft is a cone mesh rather than a real spot light: eight shadow-casting
 * spots would cost far more than the look is worth, and the same additive-cone
 * trick already sells the city's floodlights (`cityIntro/renderers/Reflector`).
 * @module features/library/components/PendantLamp
 */

import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Props for {@link PendantLamp}. */
interface PendantLampProps {
  /** `[x, z]` floor position the lamp hangs above. */
  position: [number, number]
  /** Y the cable is anchored at. */
  ceilingY: number
  /** Cable length from the ceiling down to the top of the shade. */
  drop: number
  /** Whether this fixture stutters every few seconds instead of burning steadily. */
  flicker?: boolean
  /** Deterministic offset so no two fixtures stutter in lockstep. */
  phase?: number
}

const SHADE_TOP_RADIUS = 0.1
const SHADE_BOTTOM_RADIUS = 0.44
const SHADE_HEIGHT = 0.4
/** How far the visible shaft of light reaches below the shade. */
const BEAM_LENGTH = 3.4
const LAMP_COLOR = '#ffcc7a'

/** Seconds between stutter bursts, and how long one burst lasts. */
const FLICKER_PERIOD = 7.5
const FLICKER_DURATION = 0.9

/**
 * Brightness multiplier for a failing fixture: steady between bursts, then a
 * fast on/off chatter driven by two detuned sines, so the pattern never
 * visibly repeats but stays deterministic.
 * @param t - Lamp-local time in seconds
 * @returns Multiplier in `[0, 1]`
 */
function flickerAmount(t: number): number {
  const cycle = t % FLICKER_PERIOD
  if (cycle > FLICKER_DURATION) return 1
  const chatter = Math.sin(t * 41.3) * Math.sin(t * 27.7)
  return chatter > 0 ? 1 : 0.07
}

/**
 * @param props - Placement and failure state
 * @returns Lamp group
 */
export const PendantLamp = memo(function PendantLamp({ position, ceilingY, drop, flicker = false, phase = 0 }: PendantLampProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  const bulbRef = useRef<THREE.Mesh>(null)
  const beamRef = useRef<THREE.Mesh>(null)

  const shadeY = ceilingY - drop
  const bulbY = shadeY - SHADE_HEIGHT * 0.35

  useFrame(({ clock }) => {
    const amount = flicker ? flickerAmount(clock.elapsedTime + phase) : 1
    const breathe = 0.94 + Math.sin(clock.elapsedTime * 1.3 + phase) * 0.06
    const level = amount * breathe
    if (lightRef.current) lightRef.current.intensity = 2.6 * level
    if (bulbRef.current) (bulbRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.4 * level
    if (beamRef.current) (beamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.075 * level
  })

  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, ceilingY - 0.04, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.08, 8]} />
        <meshStandardMaterial color="#12161f" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0, shadeY + drop / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, drop, 4]} />
        <meshStandardMaterial color="#0c0f16" roughness={0.9} />
      </mesh>

      <mesh position={[0, shadeY - SHADE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[SHADE_TOP_RADIUS, SHADE_BOTTOM_RADIUS, SHADE_HEIGHT, 16, 1, true]} />
        <meshStandardMaterial color="#1b2029" roughness={0.55} metalness={0.5} side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={bulbRef} position={[0, bulbY, 0]}>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshStandardMaterial color="#fff0c4" emissive={LAMP_COLOR} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      <mesh ref={beamRef} position={[0, bulbY - BEAM_LENGTH / 2, 0]} raycast={() => null}>
        <coneGeometry args={[BEAM_LENGTH * 0.42, BEAM_LENGTH, 18, 1, true]} />
        <meshBasicMaterial
          color={LAMP_COLOR}
          transparent
          opacity={0.075}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <pointLight ref={lightRef} position={[0, bulbY - 0.1, 0]} intensity={2.6} distance={7.5} color={LAMP_COLOR} decay={2} />
    </group>
  )
})
