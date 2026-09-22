import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createPlanetTexture } from '@/shared/utils/textures'

/**
 * Props for {@link SceneSun}.
 */
interface SceneSunProps {
  /** World position of the sun disc. */
  position?: [number, number, number]
  /** Core disc color. */
  color?: string
  /** Outer halo/glow color. */
  glowColor?: string
  /** Directional light intensity. */
  intensity?: number
  /** Core disc radius. */
  size?: number
  /** Whether the directional light casts shadows. */
  castShadow?: boolean
  /** Paired hemisphere light (sky/ground/intensity). */
  hemisphere?: { sky: string; ground: string; intensity: number }
}

/**
 * Reusable sun: a core disc wrapped in three additive-blended glow shells
 * (a cheap stand-in for bloom) plus its directional + hemisphere lights.
 * Drop into any scene with phase-appropriate colors and position.
 *
 * @param props - Sun appearance and lighting
 * @returns Sun + lights group
 */
export const SceneSun = memo(function SceneSun({
  position = [18, 14, -12],
  color = '#fff4d0',
  glowColor = '#ffb84a',
  intensity = 1.15,
  size = 2.2,
  castShadow = true,
  hemisphere = { sky: '#ffecd0', ground: '#6b4a2a', intensity: 0.52 },
}: SceneSunProps) {
  const discRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!discRef.current) return
    const t = clock.elapsedTime
    discRef.current.rotation.z = Math.sin(t * 0.08) * 0.04
    const pulse = 1 + Math.sin(t * 0.6) * 0.035
    discRef.current.scale.setScalar(pulse)
  })

  return (
    <group>
      <group ref={discRef} position={position}>
        <mesh>
          <sphereGeometry args={[size, 24, 24]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh>
          <sphereGeometry args={[size * 1.5, 20, 20]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <sphereGeometry args={[size * 2.3, 18, 18]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.09} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <sphereGeometry args={[size * 3.4, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.04} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <directionalLight position={position} intensity={intensity} color={color} castShadow={castShadow} shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={[hemisphere.sky, hemisphere.ground, hemisphere.intensity]} />
    </group>
  )
})

/**
 * Props for {@link SceneClouds}.
 */
interface SceneCloudsProps {
  /** Number of cloud clusters. */
  count?: number
  /** Spread of cluster X positions, centered on 0. */
  spreadX?: number
  /** [min, max] cluster Z position (usually negative — further from the player). */
  rangeZ?: [number, number]
  /** [min, max] cluster height. */
  rangeY?: [number, number]
  /** [min, max] cluster scale. */
  rangeScale?: [number, number]
  /** Top-puff color. */
  color?: string
  /** Underside-puff color, for a soft lit/shadowed look. */
  underColor?: string
}

/** One puff within a cloud cluster. */
interface CloudPuff {
  position: [number, number, number]
  radius: number
  under: boolean
}

/** One cloud cluster's drift data. */
interface CloudData {
  x: number
  y: number
  z: number
  scale: number
  speed: number
  puffs: CloudPuff[]
}

/**
 * Reusable drifting cumulus clouds built from clustered, flattened spheres —
 * puffier and more varied than a single sphere trio, with a tinted underside.
 * Drop into any scene; tune `color`/`underColor` for the scene's light.
 *
 * @param props - Cloud field configuration
 * @returns Clouds group
 */
export const SceneClouds = memo(function SceneClouds({
  count = 7,
  spreadX = 34,
  rangeZ = [-26, -8],
  rangeY = [8.5, 12],
  rangeScale = [1.1, 2.1],
  color = '#ffffff',
  underColor = '#e8d8c0',
}: SceneCloudsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [minZ, maxZ] = rangeZ
  const [minY, maxY] = rangeY
  const [minScale, maxScale] = rangeScale

  const clouds = useMemo<CloudData[]>(
    () =>
      Array.from({ length: count }).map(() => {
        const puffCount = 5 + Math.floor(Math.random() * 3)
        return {
          x: (Math.random() - 0.5) * spreadX,
          z: minZ + Math.random() * (maxZ - minZ),
          y: minY + Math.random() * (maxY - minY),
          scale: minScale + Math.random() * (maxScale - minScale),
          speed: 0.05 + Math.random() * 0.05,
          puffs: Array.from({ length: puffCount }).map((_, j) => ({
            position: [(Math.random() - 0.5) * 2.3, (Math.random() - 0.35) * 0.5, (Math.random() - 0.5) * 1.1],
            radius: 0.55 + Math.random() * 0.55,
            under: j % 3 === 0,
          })),
        }
      }),
    [count, spreadX, minZ, maxZ, minY, maxY, minScale, maxScale]
  )

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.children.forEach((cluster, i) => {
      const data = clouds[i]
      cluster.position.x = data.x + Math.sin(t * data.speed + i) * 1.4
      cluster.position.y = data.y + Math.sin(t * 0.1 + i) * 0.2
      cluster.rotation.y = Math.sin(t * 0.03 + i) * 0.08
    })
  })

  return (
    <group ref={groupRef}>
      {clouds.map((cluster, i) => (
        <group key={i} position={[cluster.x, cluster.y, cluster.z]} scale={cluster.scale}>
          {cluster.puffs.map((puff, j) => (
            <mesh key={j} position={puff.position} scale={[1, 0.72, 1]}>
              <sphereGeometry args={[puff.radius, 10, 10]} />
              <meshStandardMaterial color={puff.under ? underColor : color} transparent opacity={puff.under ? 0.26 : 0.34} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
})

/**
 * Props for {@link SceneStars}.
 */
interface SceneStarsProps {
  /** Number of stars. */
  count?: number
  /** Sky dome radius. */
  radius?: number
  /** Star color. */
  color?: string
}

/**
 * Reusable twinkling starfield — a dome of additive-blended points around the
 * scene, each with its own size and twinkle phase. Drop into any night scene.
 *
 * @param props - Star field configuration
 * @returns Points object
 */
export const SceneStars = memo(function SceneStars({ count = 900, radius = 120, color = '#ffffff' }: SceneStarsProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, phases, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 0.85)
      const r = radius * (0.85 + Math.random() * 0.15)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi) + 12
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      phases[i] = Math.random() * Math.PI * 2
      sizes[i] = 1 + Math.random() * 2.2
    }
    return { positions, phases, sizes }
  }, [count, radius])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          attribute float aPhase;
          attribute float aSize;
          uniform float uTime;
          varying float vTwinkle;
          void main() {
            vTwinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aPhase);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (1.0 + vTwinkle * 0.6);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vTwinkle;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float alpha = smoothstep(0.5, 0.0, d) * (0.4 + vTwinkle * 0.6);
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
      }),
    [color]
  )

  useFrame(({ clock }) => {
    const mat = pointsRef.current?.material as THREE.ShaderMaterial | undefined
    if (mat) mat.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <points ref={pointsRef} material={material} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  )
})

/**
 * Props for {@link ScenePlanet}.
 */
interface ScenePlanetProps {
  /** Planet radius. */
  radius?: number
  /** Base surface color. */
  color?: string
  /** Ring color; defaults to the surface color. */
  ringColor?: string
  /** Whether to draw a ring. */
  hasRing?: boolean
  /** Self-rotation speed in radians/second. */
  rotationSpeed?: number
  /** Deterministic seed for the surface pattern. */
  seed?: number
}

/**
 * Reusable distant planet: a banded, self-rotating sphere with a soft
 * atmospheric halo and an optional ring. Drop into any night sky.
 *
 * @param props - Planet appearance
 * @returns Planet group
 */
export const ScenePlanet = memo(function ScenePlanet({ radius = 3, color = '#c9a877', ringColor, hasRing = false, rotationSpeed = 0.05, seed = 1 }: ScenePlanetProps) {
  const bodyRef = useRef<THREE.Mesh>(null)
  const texture = useMemo(() => createPlanetTexture(seed, color), [seed, color])

  useFrame((_, delta) => {
    if (bodyRef.current) bodyRef.current.rotation.y += rotationSpeed * delta
  })

  return (
    <group rotation-z={0.3}>
      <mesh ref={bodyRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial map={texture} emissive={color} emissiveIntensity={0.35} roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.1, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.35, 20, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </mesh>
      {hasRing && (
        <mesh rotation-x={Math.PI / 2 - 0.15}>
          <ringGeometry args={[radius * 1.4, radius * 2.1, 48]} />
          <meshStandardMaterial color={ringColor ?? color} side={THREE.DoubleSide} transparent opacity={0.55} roughness={0.9} />
        </mesh>
      )}
    </group>
  )
})
