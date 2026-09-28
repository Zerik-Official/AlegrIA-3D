import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link LightBurst}.
 */
interface LightBurstProps {
  /** Whether the burst is playing; it starts over every time this turns true. */
  active: boolean
  /** World position the light erupts from. */
  origin: [number, number, number]
}

/** How many light rays shoot out of the burst. */
const RAY_COUNT = 14
/** Seconds the sphere takes to swell until it fills the hall. */
const SWELL_SECONDS = 1.1
/** Seconds the whole burst lasts, swell and fade included. */
const TOTAL_SECONDS = 3.2

/**
 * The returned Libro de Rosa exploding into white light on its shelf: a core
 * that flares, a sphere of light that swells until it fills the whole hall,
 * rays fanning out in every direction and a blinding point light — the cover
 * under which the abandoned library turns into the restored one.
 *
 * @param props - Activation and origin
 * @returns Burst group, or `null` while idle
 */
export const LightBurst = memo(function LightBurst({ active, origin }: LightBurstProps) {
  const startedAt = useRef<number | null>(null)
  const sphereRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const raysRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  const rays = useMemo(
    () =>
      Array.from({ length: RAY_COUNT }).map((_, i) => {
        const y = 1 - (2 * (i + 0.5)) / RAY_COUNT
        const r = Math.sqrt(1 - y * y)
        const theta = i * Math.PI * (3 - Math.sqrt(5))
        const dir = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r)
        return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      }),
    []
  )

  useFrame(({ clock }) => {
    if (!active) {
      startedAt.current = null
      return
    }
    if (startedAt.current === null) startedAt.current = clock.elapsedTime
    const t = clock.elapsedTime - startedAt.current
    const swell = THREE.MathUtils.smoothstep(t, 0, SWELL_SECONDS)
    const fade = 1 - THREE.MathUtils.smoothstep(t, SWELL_SECONDS + 0.3, TOTAL_SECONDS)

    if (sphereRef.current) {
      const s = 0.2 + swell * swell * 30
      sphereRef.current.scale.set(s, s, s)
      const mat = sphereRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.min(1, swell * 1.4) * fade
    }
    if (coreRef.current) {
      const s = 0.4 + Math.sin(Math.min(t, 0.6) * Math.PI * 2.5) * 0.3 + swell * 1.6
      coreRef.current.scale.set(s, s, s)
      const mat = coreRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = fade
    }
    if (raysRef.current) {
      raysRef.current.rotation.y = t * 0.8
      const len = 0.5 + THREE.MathUtils.smoothstep(t, 0, 0.8) * 16
      raysRef.current.children.forEach((child) => {
        child.scale.set(1, len, 1)
        const ray = child.children[0] as THREE.Mesh
        const mat = ray.material as THREE.MeshBasicMaterial
        mat.opacity = 0.75 * fade
      })
    }
    if (lightRef.current) lightRef.current.intensity = 60 * Math.min(1, t * 3) * fade
  })

  if (!active) return null

  return (
    <group position={origin}>
      <pointLight ref={lightRef} intensity={0} distance={30} color="#fff6e0" decay={1.4} />
      <mesh ref={coreRef} renderOrder={12}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={sphereRef} renderOrder={11}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#fff8ea" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={raysRef}>
        {rays.map((q, i) => (
          <group key={i} quaternion={q}>
            <mesh position={[0, 0.5, 0]} renderOrder={12}>
              <coneGeometry args={[0.09, 1, 8, 1, true]} />
              <meshBasicMaterial color="#fff4d0" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
})
