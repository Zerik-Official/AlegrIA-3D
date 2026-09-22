import { memo, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link TimeVortexSequence}.
 */
interface TimeVortexSequenceProps {
  /** Normalized progress in [0,1] driven by the wormhole timeline. */
  progress: number
  /** Whether the sequence is active. */
  active: boolean
}

/**
 * Cinematic sequence that fractures the abandoned library and throws a portal
 * in front of the viewer before absorption. Designed to be scalable: each
 * key beat is isolated so future cinematics can replace individual phases.
 *
 * Beats:
 * 0.0-0.33 — Library fracture (cyber walls flicker, floor fissures, dust surge)
 * 0.33-0.66 — Book remains as sole stable element (handled via LevitatingBook ritualProgress)
 * 0.66-1.0 — Portal thrown in front of camera and expands to swallow the view
 *
 * @param props - Cinematic state
 * @returns Cinematic group
 */
export const TimeVortexSequence = memo(function TimeVortexSequence({ progress, active }: TimeVortexSequenceProps) {
  const { camera } = useThree()
  const portalRef = useRef<THREE.Mesh>(null)
  const crackRef = useRef<THREE.Group>(null)
  const dustRef = useRef<THREE.Points>(null)

  const portalMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          vec3 p = position;
          float d = length(p.xy);
          p.z += sin(d * 7.0) * 0.06;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform float uTime;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        void main(){
          vec2 uv = vUv - 0.5;
          float r = length(uv) * 2.0;
          float ang = atan(uv.y, uv.x);
          float swirl = ang + r * 3.2 - uTime * 2.8;
          float ring = smoothstep(0.68, 0.62, abs(r - 0.56)) * (0.72 + uProgress * 0.28);
          float core = pow(1.0 - smoothstep(0.0, 0.62, r), 1.6) * (0.32 + uProgress * 0.68);
          float n = hash(uv * 5.0 + uTime * 0.4) * 0.14;
          float flick = 0.84 + 0.16 * sin(uTime * 10.0);
          float alpha = (ring * 1.1 + core + n) * flick * smoothstep(0.45, 0.72, uProgress + 0.18);
          // portal opens only in last third
          float portalGate = smoothstep(0.58, 0.78, uProgress);
          alpha *= portalGate;
          float edge = smoothstep(0.95, 0.88, r) * portalGate;
          vec3 warm = vec3(1.0, 0.86, 0.42);
          vec3 gold = vec3(1.0, 0.72, 0.12);
          vec3 cyan = vec3(0.18, 0.78, 1.0);
          vec3 col = mix(cyan, warm, smoothstep(0.2, 0.68, r));
          col = mix(col, gold, pow(r, 1.8) * 0.48);
          col += vec3(1.0) * core * 0.62;
          col += sin(swirl * 2.0) * 0.06 * uProgress;
          gl_FragColor = vec4(col, alpha * (0.92 + edge * 0.22));
        }
      `,
    })
  }, [])

  const dustPositions = useMemo(() => {
    const c = 340
    const arr = new Float32Array(c * 3)
    for (let i = 0; i < c; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18
      arr[i * 3 + 1] = Math.random() * 4.2
      arr[i * 3 + 2] = (Math.random() - 0.5) * 18
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!active && progress === 0) return

    if (portalRef.current) {
      const mat = portalRef.current.material as THREE.ShaderMaterial
      mat.uniforms.uProgress.value = progress
      mat.uniforms.uTime.value = t

      const cam = camera as THREE.PerspectiveCamera
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion)
      const pos = cam.position.clone().add(forward.multiplyScalar(1.65 + progress * 0.22))
      portalRef.current.position.copy(pos)
      portalRef.current.quaternion.copy(cam.quaternion)

      const gate = THREE.MathUtils.clamp((progress - 0.62) / 0.38, 0, 1)
      const eased = gate * gate * (3 - 2 * gate)
      const scale = 0.22 + eased * 9.2 + Math.sin(t * 8) * eased * 0.08
      portalRef.current.scale.set(scale, scale, 1)
      portalRef.current.rotation.z = t * (0.32 + progress * 1.2)
    }

    if (crackRef.current) {
      const crackProgress = THREE.MathUtils.clamp(progress / 0.38, 0, 1)
      crackRef.current.visible = crackProgress > 0.01
      crackRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial
          if (m.opacity !== undefined) m.opacity = crackProgress * 0.82
        }
      })
      const shake = progress < 0.38 ? Math.sin(t * 42) * progress * 0.06 : 0
      crackRef.current.position.x = shake
      crackRef.current.position.z = Math.sin(t * 37) * progress * 0.035
    }

    if (dustRef.current) {
      const attr = dustRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < attr.count; i++) {
        let y = attr.getY(i)
        y += 0.006 + progress * 0.028 + Math.sin(t + i) * 0.002
        if (y > 5) y = 0.05
        attr.setY(i, y)
      }
      attr.needsUpdate = true
      const m = dustRef.current.material as THREE.PointsMaterial
      m.opacity = 0.14 + progress * 0.42
      m.size = 0.028 + progress * 0.04
    }
  })

  if (!active && progress === 0) return null

  return (
    <group>
      <group ref={crackRef} visible={false}>
        {[
          { p: [0, 0.02, 0], s: [10.2, 0.02, 0.18], r: 0.12 },
          { p: [3.1, 0.02, 2.4], s: [4.8, 0.02, 0.14], r: 0.78 },
          { p: [-2.8, 0.02, -3.2], s: [5.2, 0.02, 0.12], r: -0.34 },
          { p: [-0.6, 0.02, 4.1], s: [6.0, 0.02, 0.16], r: 1.22 },
        ].map((c, i) => (
          <mesh key={i} position={c.p as [number, number, number]} rotation-y={c.r}>
            <boxGeometry args={c.s as [number, number, number]} />
            <meshStandardMaterial color="#020508" emissive="#0ab8ff" emissiveIntensity={0.22} transparent opacity={0} />
          </mesh>
        ))}
        <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[22, 22]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.18 * THREE.MathUtils.clamp(progress / 0.32, 0, 1)} depthWrite={false} />
        </mesh>
      </group>

      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.032} color="#8a9ab8" transparent opacity={0.18} depthWrite={false} sizeAttenuation />
      </points>

      <mesh ref={portalRef} visible={progress > 0.52}>
        <planeGeometry args={[1, 1, 24, 24]} />
        <primitive object={portalMaterial} attach="material" />
      </mesh>
    </group>
  )
})
