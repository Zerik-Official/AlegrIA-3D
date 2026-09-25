import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link PortalCrossingSequence}.
 */
interface PortalCrossingSequenceProps {
  /** Normalized progress in [0,1] driven by the wormhole timeline. */
  progress: number
  /** Whether the sequence is active. */
  active: boolean
  /** World position of the portal being crossed. */
  center: [number, number, number]
  /** Y rotation turning the portal's face (its local `+Z`) towards the player. */
  yaw?: number
}

/** Half extent of the area around the portal that motes are drawn in from. */
const MOTE_REACH = 10
/** Height range motes are spawned across. */
const MOTE_HEIGHT = 4.6

/** Motes of light pulled out of the hall into the portal. */
const MOTE_COUNT = 420

/**
 * Cinematic for crossing any portal the player walks into — the restored
 * library's portal to the future, and the portals the Libro de Rosa summons
 * in the open phases — played in the scene being left rather than cutting
 * away. Paired with `WormholeCamera`'s portal focus, which carries the camera
 * up to it and through.
 *
 * Beats (17s total):
 * 0.0–0.35 — The portal wakes: its vortex disc swells and motes of light from
 * all over the hall stream into it
 * 0.35–0.55 — The disc blooms until it fills the view as the camera dives in
 * 0.5–0.62 — A white-gold flash as the camera crosses the threshold
 * 0.55–1.0 — The time tunnel (drawn by `Wormhole`) carries the player onward
 *
 * @param props - Cinematic state
 * @returns Cinematic group, or `null` while idle
 */
export const PortalCrossingSequence = memo(function PortalCrossingSequence({ progress, active, center, yaw = 0 }: PortalCrossingSequenceProps) {
  const discRef = useRef<THREE.Mesh>(null)
  const motesRef = useRef<THREE.Points>(null)
  const flashRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  const discMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uProgress: { value: 0 } },
        vertexShader: `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uProgress;
          varying vec2 vUv;
          void main(){
            vec2 uv = vUv - 0.5;
            float r = length(uv) * 2.0;
            float ang = atan(uv.y, uv.x);
            float swirl = sin(ang * 5.0 + uTime * (2.0 + uProgress * 6.0) - r * 9.0) * 0.5 + 0.5;
            float core = pow(1.0 - smoothstep(0.0, 0.9, r), 1.4);
            float rim = smoothstep(0.8, 0.95, r) * (1.0 - smoothstep(0.95, 1.0, r));
            vec3 cyan = vec3(0.35, 0.85, 1.0);
            vec3 gold = vec3(1.0, 0.8, 0.3);
            vec3 col = mix(cyan, gold, swirl * (1.0 - r));
            col += vec3(1.0) * core * (0.4 + uProgress);
            float alpha = (core * 0.9 + swirl * 0.35 * (1.0 - r) + rim) * smoothstep(1.0, 0.92, r);
            gl_FragColor = vec4(col, alpha * min(1.0, uProgress * 4.0));
          }
        `,
      }),
    []
  )

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(MOTE_COUNT * 3)
    const spd = new Float32Array(MOTE_COUNT)
    for (let i = 0; i < MOTE_COUNT; i++) {
      pos[i * 3] = center[0] + (Math.random() - 0.5) * MOTE_REACH * 2
      pos[i * 3 + 1] = Math.random() * MOTE_HEIGHT
      pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * MOTE_REACH * 2
      spd[i] = 0.4 + Math.random() * 0.8
    }
    return { positions: pos, speeds: spd }
  }, [center])

  useFrame(({ clock }, delta) => {
    if (!active) return
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    discMaterial.uniforms.uTime.value = t
    discMaterial.uniforms.uProgress.value = progress
    if (discRef.current) {
      const wake = THREE.MathUtils.smoothstep(progress, 0, 0.35)
      const bloom = THREE.MathUtils.smoothstep(progress, 0.35, 0.55)
      const s = 1.2 + wake * 0.8 + bloom * bloom * 14
      discRef.current.scale.set(s, s, 1)
      discRef.current.rotation.z = t * (0.4 + progress * 2)
      discRef.current.visible = progress < 0.62
    }

    if (motesRef.current) {
      const attr = motesRef.current.geometry.attributes.position as THREE.BufferAttribute
      const pull = THREE.MathUtils.smoothstep(progress, 0.02, 0.3)
      for (let i = 0; i < MOTE_COUNT; i++) {
        const x = attr.getX(i)
        const y = attr.getY(i)
        const z = attr.getZ(i)
        const dx = center[0] - x
        const dy = center[1] - y
        const dz = center[2] - z
        const dist = Math.hypot(dx, dy, dz)
        if (dist < 0.35) {
          attr.setXYZ(i, center[0] + (Math.random() - 0.5) * MOTE_REACH * 2, Math.random() * MOTE_HEIGHT, center[2] + (Math.random() - 0.5) * MOTE_REACH * 2)
          continue
        }
        const step = Math.min(dist, speeds[i] * (1.5 + pull * 9) * dt)
        const swirl = 0.6 * pull * dt
        attr.setXYZ(i, x + (dx / dist) * step - dz * swirl * 0.1, y + (dy / dist) * step, z + (dz / dist) * step + dx * swirl * 0.1)
      }
      attr.needsUpdate = true
      const mat = motesRef.current.material as THREE.PointsMaterial
      mat.opacity = (0.35 + pull * 0.6) * (1 - THREE.MathUtils.smoothstep(progress, 0.45, 0.6))
      mat.size = 0.04 + pull * 0.05
    }

    if (flashRef.current) {
      const flash = THREE.MathUtils.smoothstep(progress, 0.48, 0.54) * (1 - THREE.MathUtils.smoothstep(progress, 0.56, 0.66))
      const mat = flashRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = flash
      flashRef.current.visible = flash > 0.01
    }

    if (lightRef.current) lightRef.current.intensity = 2 + THREE.MathUtils.smoothstep(progress, 0, 0.5) * 18
  })

  if (!active && progress === 0) return null

  return (
    <group>
      <group position={center} rotation-y={yaw}>
        <pointLight ref={lightRef} intensity={2} distance={14} color="#bfe8ff" decay={1.6} />
        <mesh ref={discRef} position={[0, 0, 0.05]} renderOrder={9}>
          <circleGeometry args={[1, 64]} />
          <primitive object={discMaterial} attach="material" />
        </mesh>
        <mesh ref={flashRef} visible={false} renderOrder={13}>
          <sphereGeometry args={[6, 24, 24]} />
          <meshBasicMaterial color="#fff6e0" transparent opacity={0} side={THREE.BackSide} depthWrite={false} depthTest={false} />
        </mesh>
      </group>
      <points ref={motesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#ffe9b0" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  )
})
