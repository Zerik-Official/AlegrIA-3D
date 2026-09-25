import { memo, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/** Where the effect sits unless told otherwise: over the pedestal's levitating book. */
const DEFAULT_CENTER: [number, number, number] = [0, 1.68, 0]

/**
 * Props for {@link TimeVortexParticles}.
 */
interface TimeVortexParticlesProps {
  /** Whether the portal is active. */
  active: boolean
  /** Normalized progress in [0,1]. */
  progress: number
  /** World position the effect is centered on — the pedestal's book by default, the portal when crossing it. */
  center?: [number, number, number]
}

/**
 * Vortex portal with particle field and distortion shader.
 * Centered at El Libro de Rosa; camera-facing so it remains centered regardless of view direction.
 * Combines additive points with a refractive disc that warps the scene behind the book.
 *
 * @param props - Portal state
 * @returns Vortex group
 */
export const TimeVortexParticles = memo(function TimeVortexParticles({ active, progress, center = DEFAULT_CENTER }: TimeVortexParticlesProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const discRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const count = 420

  const { positions, speeds, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 0.22 + Math.pow(Math.random(), 1.35) * 2.8
      const theta = Math.random() * Math.PI * 2
      const z = (Math.random() - 0.5) * 6.5
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = Math.sin(theta) * r
      pos[i * 3 + 2] = z
      spd[i] = 0.22 + Math.random() * 0.68
      sz[i] = 0.012 + Math.random() * 0.038
    }
    return { positions: pos, speeds: spd, sizes: sz }
  }, [])

  const discMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vRadial;
        void main(){
          vUv = uv;
          vec3 p = position;
          float r = length(p.xy);
          vRadial = r;
          float a = atan(p.y, p.x);
          float swirl = 1.2 + r * 0.42;
          float c = cos(a + swirl);
          float s = sin(a + swirl);
          p.x = r * c;
          p.y = r * s;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform float uTime;
        varying vec2 vUv;
        varying float vRadial;
        float noise(vec2 p){
          return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
        }
        void main(){
          vec2 uv = vUv - 0.5;
          float r = length(uv) * 2.0;
          float ring = smoothstep(0.42, 0.40, abs(r - 0.62)) * (0.55 + uProgress * 0.45);
          float flicker = 0.82 + 0.18 * sin(uTime * 12.0 + r * 9.0);
          float n = noise(uv * 6.0 + uTime * 0.6) * 0.18;
          float inner = pow(1.0 - smoothstep(0.0, 0.55, r), 1.8) * (0.42 + uProgress * 0.58);
          float distortion = sin(r * 14.0 - uTime * 4.2) * 0.06 * uProgress;
          float alpha = (ring + inner * 0.72 + n) * flicker * (0.62 + uProgress * 0.42);
          alpha += distortion * 0.28;
          vec3 warm = vec3(1.0, 0.82, 0.32);
          vec3 cyan = vec3(0.12, 0.72, 1.0);
          vec3 col = mix(cyan, warm, smoothstep(0.18, 0.78, r) * (0.62 + uProgress * 0.28));
          col += vec3(1.0, 0.96, 0.84) * inner * 0.55;
          gl_FragColor = vec4(col, alpha * 0.92);
        }
      `,
    })
  }, [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    const camQuat = (camera as THREE.PerspectiveCamera).quaternion
    const target = new THREE.Quaternion().copy(camQuat)
    const flip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
    target.multiply(flip)
    groupRef.current.quaternion.slerp(target, active ? 0.2 : 0.07)

    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      const sizeAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute | undefined
      for (let i = 0; i < count; i++) {
        let x = attr.getX(i)
        let y = attr.getY(i)
        let z = attr.getZ(i)
        const ang = Math.atan2(y, x)
        const rad = Math.hypot(x, y)
        const swirl = speeds[i] * (0.22 + progress * 0.55)
        const nextAng = ang + swirl * 0.06
        const nextRad = rad * (1 - progress * 0.0025) + Math.sin(t * 0.7 + i * 0.04) * 0.003
        const nextZ = z + speeds[i] * (0.06 + progress * 0.18) * (rad < 1.1 ? -1 : 1)
        let nz = nextZ
        if (nz > 3.2 || nz < -3.2) nz = (Math.random() - 0.5) * 2.8
        attr.setXYZ(i, Math.cos(nextAng) * nextRad, Math.sin(nextAng) * nextRad, nz)
        if (sizeAttr) sizeAttr.setX(i, sizes[i] * (1 + progress * 1.9 + Math.sin(t * 1.2 + i) * 0.18))
      }
      attr.needsUpdate = true
      if (sizeAttr) sizeAttr.needsUpdate = true
      pointsRef.current.rotation.z = t * (0.12 + progress * 0.28)
    }

    if (discRef.current) {
      const mat = discRef.current.material as THREE.ShaderMaterial
      mat.uniforms.uProgress.value = progress
      mat.uniforms.uTime.value = t
      const s = 1 + progress * 1.25 + Math.sin(t * 1.1) * 0.04
      discRef.current.scale.set(s, s, 1)
      discRef.current.rotation.z = t * (0.18 + progress * 0.42)
    }

    if (active) groupRef.current.rotateZ(0.012 + progress * 0.035)
  })

  if (!active && progress === 0) return null

  return (
    <group ref={groupRef} position={center}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial size={0.028} color="#ffe9c4" transparent opacity={0.88} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>

      <mesh ref={discRef} position={[0, 0, 0.08]}>
        <planeGeometry args={[4.2, 4.2, 32, 32]} />
        <primitive object={discMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 0, -0.22]}>
        <sphereGeometry args={[0.62 + progress * 2.4, 24, 24]} />
        <meshBasicMaterial color="#fff7e0" transparent opacity={0.18 + progress * 0.32} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
})
