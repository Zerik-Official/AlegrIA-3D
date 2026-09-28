import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createSeededRandom } from '@/shared/utils/random'
import { GlowSprite } from '@/shared/components/LightGlows'

/** Deterministic random source for this module's procedural layout, so render stays pure. */
const seededRandom = createSeededRandom(66226)

/**
 * Props for {@link ProceduralTree}.
 */
interface TreeProps {
  /** World position. */
  position: [number, number, number]
  /** Uniform scale. */
  scale?: number
  /** Foliage color. */
  foliageColor?: string
  /** Trunk color. */
  trunkColor?: string
}

/**
 * Low-poly reusable tree with parametric colors and scale.
 * Reuse across phases to avoid polygon duplication.
 *
 * @param props - Tree appearance
 * @returns Tree group
 */
export const ProceduralTree = memo(function ProceduralTree({ position, scale = 1, foliageColor = '#2a5a1e', trunkColor = '#3d2b1f' }: TreeProps) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 1.05, 7]} />
        <meshStandardMaterial color={trunkColor} roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.22, 0]} castShadow>
        <icosahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial color={foliageColor} roughness={0.88} />
      </mesh>
      <mesh position={[0.18, 1.02, 0.12]} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={foliageColor} roughness={0.88} />
      </mesh>
    </group>
  )
})

/**
 * Props for {@link ProceduralTrinitaria}.
 */
interface TrinitariaProps {
  /** World position. */
  position: [number, number, number]
  /** Bloom color (magenta/purple/orange). */
  bloomColor?: string
  /** Scale. */
  scale?: number
}

/**
 * Reusable trinitaria (bougainvillea) with paper-like blooms.
 *
 * @param props - Flower appearance
 * @returns Flower group
 */
export const ProceduralTrinitaria = memo(function ProceduralTrinitaria({ position, bloomColor = '#d82a7a', scale = 1 }: TrinitariaProps) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.08
  })
  const blooms = useMemo(
    () =>
      Array.from({ length: 7 }).map(() => ({
        p: [(seededRandom() - 0.5) * 0.62, 0.18 + seededRandom() * 0.42, (seededRandom() - 0.5) * 0.62] as [number, number, number],
        s: 0.12 + seededRandom() * 0.1,
      })),
    []
  )
  return (
    <group position={position} scale={scale} ref={ref}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.64, 6]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.92} />
      </mesh>
      {blooms.map((b, i) => (
        <mesh key={i} position={b.p} scale={b.s}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color={bloomColor} side={THREE.DoubleSide} roughness={0.92} emissive={bloomColor} emissiveIntensity={0.08} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.18, 7, 7]} />
        <meshStandardMaterial color="#2a5a1e" roughness={0.92} />
      </mesh>
    </group>
  )
})

/**
 * Props for {@link PortalEmbers}.
 */
interface PortalEmbersProps {
  /** Orbit radius reference (embers drift between ~55% and ~97% of it). */
  radius: number
  /** Instance count. */
  count?: number
  /** Ember color. */
  color?: string
}

/**
 * Instanced glowing motes orbiting the portal ring at varying radius/speed/depth.
 * @param props - Ember appearance
 * @returns Instanced ember mesh
 */
const PortalEmbers = memo(function PortalEmbers({ radius, count = 26, color = '#ffe27a' }: PortalEmbersProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const data = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        angle: seededRandom() * Math.PI * 2,
        speed: (seededRandom() > 0.5 ? 1 : -1) * (0.4 + seededRandom() * 0.6),
        orbitRadius: radius * (0.55 + seededRandom() * 0.42),
        zOffset: (seededRandom() - 0.5) * 0.18,
        scale: 0.03 + seededRandom() * 0.05,
      })),
    [radius, count]
  )
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 6, 6), [])
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
    [color]
  )

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const t = clock.elapsedTime
    data.forEach((d, i) => {
      const a = d.angle + t * d.speed
      dummy.position.set(Math.cos(a) * d.orbitRadius, Math.sin(a) * d.orbitRadius, d.zOffset + Math.sin(t * 2 + i) * 0.04)
      dummy.scale.setScalar(d.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />
})

/**
 * Props for {@link ProceduralPortal}.
 */
interface PortalProps {
  /** World position. */
  position: [number, number, number]
  /** Portal radius. */
  radius?: number
  /** Label for accessibility. */
  label?: string
  /** Warm accent color for the outer ring, halo and embers. */
  accentColor?: string
  /** Cool glow color for the inner ring, vortex disc and ground light. */
  glowColor?: string
  /** Whether the portal casts real light; off where the scene is short on light budget, leaving a halo in its place. */
  castsLight?: boolean
}

/**
 * Reusable portal to travel between phases: a layered ring (halo + tube +
 * inner glow), a swirling shader vortex, and orbiting embers. Place anywhere;
 * `accentColor`/`glowColor` let each scene retint it (e.g. via an entity's
 * `variant`), and a real `.glb` can still override it via `phase2/portal` in `models.ts`.
 *
 * @param props - Portal placement and colors
 * @returns Portal group
 */
export const ProceduralPortal = memo(function ProceduralPortal({ position, radius = 1.15, accentColor = '#ffcc33', glowColor = '#0ab8ff', castsLight = true }: PortalProps) {
  const outerRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const vortexRef = useRef<THREE.Mesh>(null)

  const vortexMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: new THREE.Color(glowColor) },
          uColorB: { value: new THREE.Color(accentColor) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying vec2 vUv;
          void main(){
            vec2 uv = vUv - 0.5;
            float r = length(uv) * 2.0;
            float angle = atan(uv.y, uv.x);
            float swirl = angle * 3.0 + uTime * 1.6 - r * 5.0;
            float bands = sin(swirl) * 0.5 + 0.5;
            float glow = smoothstep(1.0, 0.0, r);
            vec3 color = mix(uColorA, uColorB, bands);
            float alpha = glow * (0.5 + bands * 0.4);
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    [glowColor, accentColor]
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (outerRef.current) outerRef.current.rotation.z = t * 0.32
    if (innerRef.current) innerRef.current.rotation.z = -t * 0.58
    if (haloRef.current) {
      const s = 1 + Math.sin(t * 1.1) * 0.05
      haloRef.current.scale.set(s, s, 1)
    }
    const vortexMat = vortexRef.current?.material as THREE.ShaderMaterial | undefined
    if (vortexMat) vortexMat.uniforms.uTime.value = t
  })

  return (
    <group position={position}>
      <mesh ref={haloRef}>
        <ringGeometry args={[radius * 0.98, radius * 1.18, 40]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.28} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={outerRef}>
        <torusGeometry args={[radius * 0.86, radius * 0.05, 10, 48]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.85} roughness={0.32} metalness={0.5} />
      </mesh>
      <mesh ref={innerRef}>
        <ringGeometry args={[radius * 0.62, radius * 0.72, 36]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.0} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh ref={vortexRef}>
        <circleGeometry args={[radius * 0.6, 40]} />
        <primitive object={vortexMaterial} attach="material" />
      </mesh>
      <PortalEmbers radius={radius} color={accentColor} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <circleGeometry args={[radius * 0.9, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.16} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {castsLight ? (
        <>
          <pointLight intensity={1.6} distance={4.6} color={glowColor} decay={2} />
          <pointLight intensity={0.9} distance={3.2} color={accentColor} decay={2} position={[0, 0, 0.4]} />
        </>
      ) : (
        <GlowSprite color={glowColor} size={radius * 4} opacity={0.4} />
      )}
    </group>
  )
})
