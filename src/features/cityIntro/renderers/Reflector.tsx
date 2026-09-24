/**
 * Ground floodlight aimed at a point: a spot light, its housing and a faint
 * additive beam cone so the light reads even in the dark.
 * @module features/cityIntro/renderers/Reflector
 */

import { useMemo } from 'react'
import * as THREE from 'three'

/** Props for {@link Reflector}. */
interface ReflectorProps {
  /** Fixture position (parent-local). */
  position: [number, number, number]
  /** Point (parent-local) the light is aimed at. */
  aimAt: [number, number, number]
  /** Light / lens / beam color. */
  color: string
  /** Spot intensity. */
  intensity?: number
}

const CONE_ANGLE = 0.42
const BEAM_LENGTH = 20

/**
 * @param props - Placement, aim and color
 * @returns Reflector group
 */
export function Reflector({ position, aimAt, color, intensity = 90 }: ReflectorProps) {
  const target = useMemo(() => {
    const t = new THREE.Object3D()
    t.position.set(...aimAt)
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aimAt[0], aimAt[1], aimAt[2]])
  const beamQuaternion = useMemo(() => {
    const dir = target.position.clone().sub(new THREE.Vector3(...position)).normalize()
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, position[0], position[1], position[2]])
  const lens = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.6), [color])

  return (
    <group>
      <primitive object={target} />
      <spotLight position={position} target={target} color={color} intensity={intensity} angle={CONE_ANGLE} penumbra={0.65} distance={45} decay={1.6} />
      <mesh position={[position[0], 0.2, position[2]]} castShadow>
        <boxGeometry args={[0.9, 0.4, 0.9]} />
        <meshStandardMaterial color="#1c1c22" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[position[0], 0.42, position[2]]} rotation-x={-0.25}>
        <cylinderGeometry args={[0.32, 0.36, 0.3, 14]} />
        <meshStandardMaterial color={lens} emissive={color} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <group position={position} quaternion={beamQuaternion}>
        <mesh position={[0, 0, BEAM_LENGTH / 2]} rotation-x={-Math.PI / 2} raycast={() => null}>
          <coneGeometry args={[Math.tan(CONE_ANGLE) * BEAM_LENGTH * 0.55, BEAM_LENGTH, 20, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}