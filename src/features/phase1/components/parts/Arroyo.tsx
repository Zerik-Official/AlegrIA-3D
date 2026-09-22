import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Realistic river with flowing shader, banks and meander.
 *
 * @returns Arroyo group
 */
export const Arroyo = memo(function Arroyo() {
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
})
