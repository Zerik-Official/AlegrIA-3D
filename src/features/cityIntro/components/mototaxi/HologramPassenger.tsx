/**
 * The player's stand-in on the mototaxi's bench, seen from the chase camera:
 * a seated human figure made of white light — rim-lit, with scanlines
 * sweeping up it — detailed enough to read as a person, featureless enough
 * not to give the player an identity.
 * @module features/cityIntro/components/mototaxi/HologramPassenger
 */

import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const HOLOGRAM_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vHeight;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vHeight = world.y;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const HOLOGRAM_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vHeight;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.2);
    float lines = 0.55 + 0.45 * sin(vHeight * 90.0 - uTime * 6.0);
    float sweep = smoothstep(0.0, 0.08, fract(vHeight * 0.6 - uTime * 0.35)) * (1.0 - smoothstep(0.08, 0.2, fract(vHeight * 0.6 - uTime * 0.35)));
    float flicker = 0.92 + 0.08 * sin(uTime * 37.0);
    float alpha = (0.14 + rim * 0.75) * lines * flicker + sweep * 0.35;
    gl_FragColor = vec4(vec3(0.86, 0.95, 1.0) * (0.7 + rim), alpha);
  }
`

/** One body part: a capsule between two joints. */
interface Limb {
  from: [number, number, number]
  to: [number, number, number]
  radius: number
}

/**
 * Seated pose, in the figure's local space (origin at the seat, facing `+X`).
 */
const LIMBS: Limb[] = [
  { from: [0, 0.12, 0], to: [0.02, 0.62, 0], radius: 0.17 },
  { from: [0.02, 0.62, 0.2], to: [0.2, 0.3, 0.24], radius: 0.055 },
  { from: [0.02, 0.62, -0.2], to: [0.2, 0.3, -0.24], radius: 0.055 },
  { from: [0.2, 0.3, 0.24], to: [0.42, 0.32, 0.2], radius: 0.045 },
  { from: [0.2, 0.3, -0.24], to: [0.42, 0.32, -0.2], radius: 0.045 },
  { from: [0.02, 0.06, 0.1], to: [0.46, 0.06, 0.12], radius: 0.085 },
  { from: [0.02, 0.06, -0.1], to: [0.46, 0.06, -0.12], radius: 0.085 },
  { from: [0.46, 0.06, 0.12], to: [0.5, -0.38, 0.12], radius: 0.065 },
  { from: [0.46, 0.06, -0.12], to: [0.5, -0.38, -0.12], radius: 0.065 },
  { from: [0.5, -0.4, 0.12], to: [0.64, -0.42, 0.12], radius: 0.05 },
  { from: [0.5, -0.4, -0.12], to: [0.64, -0.42, -0.12], radius: 0.05 },
  { from: [0.02, 0.7, 0], to: [0.02, 0.78, 0], radius: 0.06 },
]

/** Reused vectors for orienting limbs. */
const up = new THREE.Vector3(0, 1, 0)

/**
 * @param limb - Joint positions and thickness
 * @returns Capsule transform: center, rotation and length
 */
function limbTransform(limb: Limb): { position: THREE.Vector3; quaternion: THREE.Quaternion; length: number } {
  const a = new THREE.Vector3(...limb.from)
  const b = new THREE.Vector3(...limb.to)
  const dir = b.clone().sub(a)
  const length = dir.length()
  return {
    position: a.clone().add(b).multiplyScalar(0.5),
    quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()),
    length,
  }
}

/**
 * Props for {@link HologramPassenger}.
 */
interface HologramPassengerProps {
  /** Whether the figure is drawn. */
  visible: boolean
  /** Position of the seat surface, in the vehicle's local space. */
  position: [number, number, number]
}

/**
 * @param props - Visibility and seat placement
 * @returns Hologram figure
 */
export const HologramPassenger = memo(function HologramPassenger({ visible, position }: HologramPassengerProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: HOLOGRAM_VERTEX,
        fragmentShader: HOLOGRAM_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    []
  )
  const limbs = useMemo(() => LIMBS.map((limb) => ({ ...limbTransform(limb), radius: limb.radius })), [])

  const headRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const head = headRef.current
    if (visible && head) (head.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <group position={position} visible={visible}>
      {limbs.map((limb, i) => (
        <mesh key={i} position={limb.position} quaternion={limb.quaternion} material={material}>
          <capsuleGeometry args={[limb.radius, Math.max(0.01, limb.length - limb.radius), 4, 10]} />
        </mesh>
      ))}
      <mesh ref={headRef} position={[0.04, 0.92, 0]} material={material}>
        <sphereGeometry args={[0.12, 18, 14]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} material={material}>
        <ringGeometry args={[0.32, 0.36, 40]} />
      </mesh>
    </group>
  )
})
