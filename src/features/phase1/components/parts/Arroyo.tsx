import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createSoftCircleTexture } from '@/shared/utils/textures'

/** X span the river, its banks and reeds run across. */
const SPAN_X = 19

/**
 * Generates (once) a tapered reed-blade silhouette with a base-to-tip gradient.
 * @returns Canvas-based reed texture
 */
function useReedTexture(): THREE.Texture {
  return useMemo(() => {
    const w = 16
    const h = 96
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(w * 0.5 - 1.4, h)
    ctx.quadraticCurveTo(w * 0.5 - 2.2, h * 0.35, w * 0.5, 0)
    ctx.quadraticCurveTo(w * 0.5 + 2.2, h * 0.35, w * 0.5 + 1.4, h)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, h, 0, 0)
    gradient.addColorStop(0, '#3a4a1e')
    gradient.addColorStop(0.6, '#5c7a2e')
    gradient.addColorStop(1, '#9cbf5a')
    ctx.fillStyle = gradient
    ctx.fill()
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
}

/**
 * Props for {@link BankRocks}.
 */
interface BankRocksProps {
  /** Band center Z. */
  zCenter: number
  /** Band half-width in Z. */
  zJitter: number
  /** Instance count. */
  count: number
}

/**
 * Instanced low-poly pebbles/rocks scattered along a Z band, replacing a
 * single blocky bank bar with an irregular, natural-looking edge.
 * @param props - Band placement
 * @returns Instanced rock mesh
 */
function BankRocks({ zCenter, zJitter, count }: BankRocksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.09, 0), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.95 }), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const x = -SPAN_X + Math.random() * SPAN_X * 2
      const z = zCenter + (Math.random() - 0.5) * zJitter
      const y = 0.02 + Math.random() * 0.05
      dummy.position.set(x, y, z)
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      const s = 0.55 + Math.random() * 1.15
      dummy.scale.set(s, s * 0.7, s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      const tone = 0.35 + Math.random() * 0.35
      color.setRGB(tone * 0.44, tone * 0.4, tone * 0.34)
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [zCenter, zJitter, count])

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow receiveShadow />
}

/**
 * Props for {@link ReedLine}.
 */
interface ReedLineProps {
  /** Band center Z. */
  zCenter: number
  /** Instance count. */
  count: number
}

/**
 * Instanced crossed-plane reeds hugging just outside the riverbank.
 * @param props - Band placement
 * @returns Instanced reed mesh
 */
function ReedLine({ zCenter, count }: ReedLineProps) {
  const texture = useReedTexture()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.24, 0.85)
    g.translate(0, 0.425, 0)
    return g
  }, [])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }),
    [texture]
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const x = -SPAN_X + Math.random() * SPAN_X * 2
      const z = zCenter + (Math.random() - 0.5) * 0.7
      const s = 0.6 + Math.random() * 0.7
      dummy.position.set(x, 0, z)
      dummy.rotation.set(0, Math.random() * Math.PI, 0)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [zCenter, count])

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow />
}

/**
 * Realistic river with a flowing shader, irregular rocky banks and reeds.
 *
 * @returns Arroyo group
 */
export const Arroyo = memo(function Arroyo() {
  const waterRef = useRef<THREE.Mesh>(null)
  const bankAlphaMap = useMemo(() => createSoftCircleTexture(), [])

  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main(){
          vUv = uv;
          vec3 p = position;
          float meander = sin(p.x * 0.18 + uTime * 0.22) * 0.18;
          p.z += meander * (1.0 - abs(uv.y - 0.5) * 0.18);
          p.z += sin(p.x * 0.42 - uTime * 0.42) * 0.06 * uv.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        void main(){
          vec2 uv = vUv;
          float flow = uv.x * 6.0 - uTime * 0.62;
          float ripple = sin(flow * 2.2 + uv.y * 14.0) * 0.12;
          float ripple2 = sin(flow * 1.1 - uv.y * 9.0) * 0.08;
          float n = hash(uv * 4.0 + uTime * 0.08) * 0.06;
          float foam = smoothstep(0.68, 0.72, abs(uv.y - 0.5) * 2.0) * (0.42 + ripple * 0.4);

          vec3 deep = vec3(0.08, 0.2, 0.22);
          vec3 mid = vec3(0.16, 0.4, 0.44);
          vec3 shallow = vec3(0.44, 0.68, 0.66);
          vec3 water = mix(deep, mid, smoothstep(-0.25, 0.35, ripple + ripple2));
          water = mix(water, shallow, smoothstep(0.25, 0.85, ripple + n));
          water += foam * vec3(0.92, 0.96, 0.98) * 0.72;

          float sparkle = pow(hash(uv * 46.0 + floor(uTime * 3.0)), 16.0) * 2.2;
          water += sparkle * vec3(0.9, 0.98, 1.0);

          float edgeFade = smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);
          float alpha = 0.88 * edgeFade + foam * 0.22 + sparkle * 0.3;
          gl_FragColor = vec4(water, alpha);
        }
      `,
    })
  }, [])

  useFrame(({ clock }) => {
    if (!waterRef.current) return
    const mat = waterRef.current.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -1.1]} receiveShadow>
        <planeGeometry args={[38, 3.8]} />
        <meshStandardMaterial color="#3a4a2e" roughness={1} />
      </mesh>

      {[-3.05, -2.85, 0.65, 0.85].map((z, i) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.018, z]} receiveShadow>
          <planeGeometry args={[38, 0.5]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#4a3a22' : '#5a4a2a'} alphaMap={bankAlphaMap} transparent roughness={1} depthWrite={false} />
        </mesh>
      ))}

      <BankRocks zCenter={-2.95} zJitter={0.5} count={44} />
      <BankRocks zCenter={0.75} zJitter={0.5} count={44} />
      <ReedLine zCenter={-3.5} count={38} />
      <ReedLine zCenter={1.3} count={38} />

      <mesh ref={waterRef} rotation-x={-Math.PI / 2} position={[0, 0.038, -1.1]} receiveShadow>
        <planeGeometry args={[38, 2.2, 36, 8]} />
        <primitive object={waterMaterial} attach="material" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.042, -1.1]}>
        <planeGeometry args={[38, 0.62]} />
        <meshStandardMaterial color="#8ab4c2" roughness={0.22} metalness={0.18} transparent opacity={0.16} />
      </mesh>

      <BankRocks zCenter={-1.1} zJitter={1.6} count={12} />
    </group>
  )
})
