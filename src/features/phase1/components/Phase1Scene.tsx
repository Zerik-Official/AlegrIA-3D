import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'

/**
 * Procedural bahareque house with mud walls and exposed log frame.
 */
function ProceduralBaharequeHouse({
  position,
  rotationY = 0,
  scale = 1,
}: {
  position: [number, number, number]
  rotationY?: number
  scale?: number
}) {
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.7, 2.2]} />
        <meshStandardMaterial color="#8b5e3c" roughness={0.96} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.85, 0.02]}>
        <boxGeometry args={[2.84, 1.74, 2.24]} />
        <meshStandardMaterial color="#3d2b1f" wireframe={false} transparent opacity={0} />
      </mesh>
      {/* Log frame vertical */}
      {[-1.35, 1.35].map((x) => (
        <mesh key={x} position={[x, 0.85, 1.12]} castShadow>
          <boxGeometry args={[0.09, 1.72, 0.09]} />
          <meshStandardMaterial color="#2e1f14" roughness={0.88} />
        </mesh>
      ))}
      {/* Log frame horizontal */}
      <mesh position={[0, 1.62, 1.12]}>
        <boxGeometry args={[2.9, 0.09, 0.09]} />
        <meshStandardMaterial color="#2e1f14" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.12, 1.12]}>
        <boxGeometry args={[2.9, 0.09, 0.09]} />
        <meshStandardMaterial color="#2e1f14" roughness={0.88} />
      </mesh>
      {/* Roof thatch */}
      <mesh position={[0, 1.82, 0]} rotation-x={0.22} castShadow>
        <boxGeometry args={[3.1, 0.18, 2.5]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.98} />
      </mesh>
      <mesh position={[0, 1.95, -0.02]} rotation-x={-0.22} castShadow>
        <boxGeometry args={[3.1, 0.18, 2.5]} />
        <meshStandardMaterial color="#6b4a1f" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.42, 1.13]}>
        <planeGeometry args={[0.62, 0.78]} />
        <meshStandardMaterial color="#1a1208" roughness={1} />
      </mesh>
    </group>
  )
}

/**
 * Andén Alto — elevated sidewalk to resist arroyos.
 */
function ProceduralAndenAlto({ position, length = 3.2 }: { position: [number, number, number]; length?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[length, 0.44, 1.05]} />
        <meshStandardMaterial color="#9a8a6a" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[length + 0.06, 0.06, 1.12]} />
        <meshStandardMaterial color="#7a6a4a" roughness={0.88} />
      </mesh>
      <mesh position={[0, -0.05, 0.52]}>
        <boxGeometry args={[length, 0.12, 0.04]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.86} />
      </mesh>
    </group>
  )
}

/**
 * Arroyo — realistic river with flowing shader, banks and meander.
 */
function ProceduralArroyo() {
  const waterRef = useRef<THREE.Mesh>(null)

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
          float foam = smoothstep(0.68, 0.72, abs(uv.y - 0.5) * 2.0) * (0.42 + ripple * 0.4);
          float n = hash(uv * 4.0 + uTime * 0.08) * 0.06;
          vec3 deep = vec3(0.22, 0.32, 0.28);
          vec3 shallow = vec3(0.42, 0.58, 0.62);
          vec3 water = mix(deep, shallow, 0.42 + ripple + ripple2 + n);
          water += foam * vec3(0.92, 0.96, 0.98) * 0.72;
          float edgeFade = smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);
          float alpha = 0.88 * edgeFade + foam * 0.22;
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
      <mesh position={[0, 0.08, -2.95]} receiveShadow>
        <boxGeometry args={[38, 0.18, 0.42]} />
        <meshStandardMaterial color="#5a4a2a" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.08, 0.75]} receiveShadow>
        <boxGeometry args={[38, 0.18, 0.42]} />
        <meshStandardMaterial color="#5a4a2a" roughness={0.92} />
      </mesh>
      <mesh ref={waterRef} rotation-x={-Math.PI / 2} position={[0, 0.038, -1.1]} receiveShadow>
        <planeGeometry args={[38, 2.2, 36, 8]} />
        <primitive object={waterMaterial} attach="material" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.042, -1.1]}>
        <planeGeometry args={[38, 0.62]} />
        <meshStandardMaterial color="#8ab4c2" roughness={0.22} metalness={0.18} transparent opacity={0.16} />
      </mesh>
      {[-14, -8, 0, 8, 14].map((x) => (
        <mesh key={x} position={[x, 0.06, -1.1]} rotation-y={Math.random() * 0.22}>
          <boxGeometry args={[0.22, 0.07, 0.18]} />
          <meshStandardMaterial color="#6b5a3a" roughness={0.94} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Sepia photo floating with orange tint.
 */
function ProceduralSepiaPhoto({
  position,
  rotationY = 0,
  imageIndex = 0,
}: {
  position: [number, number, number]
  rotationY?: number
  imageIndex?: number
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime + imageIndex * 1.3
    ref.current.position.y = position[1] + Math.sin(t * 0.42) * 0.14
    ref.current.rotation.y = rotationY + Math.sin(t * 0.18) * 0.08
    ref.current.rotation.z = Math.sin(t * 0.22) * 0.04
  })
  return (
    <group ref={ref} position={position} rotation-y={rotationY}>
      <mesh castShadow>
        <boxGeometry args={[1.45, 1.02, 0.04]} />
        <meshStandardMaterial color="#1a1208" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[1.38, 0.96, 0.015]} />
        <meshStandardMaterial color="#c9a86a" metalness={0.18} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[1.32, 0.9]} />
        <meshStandardMaterial color="#704214" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0, 0.044]}>
        <planeGeometry args={[1.32, 0.9]} />
        <meshStandardMaterial color="#ff8a1a" transparent opacity={0.22} roughness={1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.58, 0.02]}>
        <planeGeometry args={[0.92, 0.08]} />
        <meshBasicMaterial color="#f5e6c8" transparent opacity={0.92} />
      </mesh>
    </group>
  )
}

/**
 * Phase 1 scene — Barrio Abajo origins (1857–1900).
 * Tierra, bahareque, andenes altos, arroyo and sepia memory photos.
 * All meshes support Blender replacement via registry (`phase1/*`).
 *
 * @returns Phase 1 group
 */
export const Phase1Scene = memo(function Phase1Scene() {
  const aduanaEntry = modelRegistry['phase1/aduana']
  const estacionEntry = modelRegistry['phase1/estacion-montoya']

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color="#6b4a2a" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#7a5a2e" roughness={0.98} />
      </mesh>
      <gridHelper args={[40, 10, '#5a3d1a', '#7a5a2e']} position={[0, 0.002, 0]} />

      <ProceduralArroyo />

      <ModelLoader
        src={aduanaEntry.path}
        fallback={
          <group position={[-7.2, 0, 4.2]}>
            <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.6, 2.1, 2.4]} />
              <meshStandardMaterial color="#c9b896" roughness={0.86} />
            </mesh>
            <mesh position={[0, 2.22, 0]}>
              <boxGeometry args={[3.8, 0.18, 2.6]} />
              <meshStandardMaterial color="#2e1f14" roughness={0.88} />
            </mesh>
            {[ -1.1, 0, 1.1].map((x) => (
              <mesh key={x} position={[x, 1.05, 1.22]}>
                <boxGeometry args={[0.22, 1.1, 0.05]} />
                <meshStandardMaterial color="#1a1208" />
              </mesh>
            ))}
          </group>
        }
      />

      <ModelLoader
        src={estacionEntry.path}
        fallback={
          <group position={[7.4, 0, 5.1]} rotation-y={-0.22}>
            <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
              <boxGeometry args={[4.1, 1.9, 1.9]} />
              <meshStandardMaterial color="#8a7a5a" roughness={0.92} />
            </mesh>
            <mesh position={[0, 1.92, 0]}>
              <boxGeometry args={[4.3, 0.14, 2.1]} />
              <meshStandardMaterial color="#3d2b1f" roughness={0.88} />
            </mesh>
          </group>
        }
      />

      <ModelLoader src={modelRegistry['phase1/bahareque-house'].path} fallback={<ProceduralBaharequeHouse position={[-4.2, 0, -4.2]} rotationY={0.18} />} />
      <ModelLoader src={modelRegistry['phase1/bahareque-house'].path} fallback={<ProceduralBaharequeHouse position={[3.8, 0, -3.8]} rotationY={-0.22} scale={0.92} />} />
      <ModelLoader src={modelRegistry['phase1/bahareque-house'].path} fallback={<ProceduralBaharequeHouse position={[-1.2, 0, -6.2]} rotationY={0.08} scale={0.88} />} />
      <ModelLoader src={modelRegistry['phase1/bahareque-house'].path} fallback={<ProceduralBaharequeHouse position={[5.2, 0, 0.8]} rotationY={-0.42} scale={0.96} />} />
      <ModelLoader src={modelRegistry['phase1/bahareque-house'].path} fallback={<ProceduralBaharequeHouse position={[-5.8, 0, 1.2]} rotationY={0.32} scale={0.9} />} />

      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<ProceduralAndenAlto position={[-4.2, 0, -3.6]} length={3.4} />} />
      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<ProceduralAndenAlto position={[3.8, 0, -3.2]} length={3.1} />} />
      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<ProceduralAndenAlto position={[-1.2, 0, -5.6]} length={2.8} />} />
      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<ProceduralAndenAlto position={[0, 0, 7.2]} length={9.2} />} />
      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<ProceduralAndenAlto position={[-8.2, 0, 1.8]} length={2.6} />} />
      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<ProceduralAndenAlto position={[8.0, 0, 2.2]} length={2.8} />} />

      <ModelLoader src={modelRegistry['phase1/sepia-photo'].path} fallback={<ProceduralSepiaPhoto position={[-1.2, 1.85, 1.85]} rotationY={0.22} imageIndex={0} />} />
      <ModelLoader src={modelRegistry['phase1/sepia-photo'].path} fallback={<ProceduralSepiaPhoto position={[1.6, 1.92, 2.4]} rotationY={-0.18} imageIndex={1} />} />
      <ModelLoader src={modelRegistry['phase1/sepia-photo'].path} fallback={<ProceduralSepiaPhoto position={[0.2, 2.05, 3.2]} rotationY={0.08} imageIndex={2} />} />
      <ModelLoader src={modelRegistry['phase1/sepia-photo'].path} fallback={<ProceduralSepiaPhoto position={[-3.2, 1.78, 5.2]} rotationY={0.42} imageIndex={3} />} />
      <ModelLoader src={modelRegistry['phase1/sepia-photo'].path} fallback={<ProceduralSepiaPhoto position={[3.4, 1.78, 5.8]} rotationY={-0.32} imageIndex={4} />} />
      <ModelLoader src={modelRegistry['phase1/sepia-photo'].path} fallback={<ProceduralSepiaPhoto position={[0, 2.18, -3.2]} rotationY={0.02} imageIndex={5} />} />

      <ambientLight intensity={0.62} color="#ffe9c4" />
      <hemisphereLight args={['#ffecd0', '#6b4a2a', 0.52]} />
      <directionalLight position={[8, 10, 4]} intensity={1.35} color="#fff4d0" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 3.2, -1.2]} intensity={0.42} distance={9} color="#8ab4c2" decay={2} />
    </group>
  )
})
