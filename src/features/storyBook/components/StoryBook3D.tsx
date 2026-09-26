import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RosaBookModel } from '@/models/shared/RosaBookModel'
import type { StoryBookStage } from '@/app/hooks/useStoryBookFlow'

/**
 * Props for {@link StoryBook3D}.
 */
interface StoryBook3DProps {
  /** Beat of the choreography — drives spin, shaking and glow. */
  stage: StoryBookStage
}

/** Height of the book in its canvas. */
const BOOK_HEIGHT = 1.02

/** Target values each stage eases towards. */
const STAGE_TARGETS: Record<StoryBookStage, { spin: number; jitter: number; glow: number }> = {
  hidden: { spin: 0, jitter: 0, glow: 0.4 },
  calm: { spin: 0, jitter: 0, glow: 0.55 },
  restless: { spin: 5.2, jitter: 1, glow: 1.6 },
  summoning: { spin: 11, jitter: 0.35, glow: 2.6 },
  portal: { spin: 14, jitter: 0, glow: 3.2 },
}

/**
 * Soft radial glow for the halo sprite: fully transparent well before the
 * texture's edge, so however large the halo grows it fades out instead of
 * being clipped into a square by the small canvas it lives in.
 * @returns Canvas texture of a warm radial falloff
 */
function createHaloTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,236,170,0.9)')
  gradient.addColorStop(0.35, 'rgba(255,190,80,0.35)')
  gradient.addColorStop(0.75, 'rgba(255,150,40,0.06)')
  gradient.addColorStop(1, 'rgba(255,150,40,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Largest the halo may grow — keeps it inside the canvas' visible frame. */
const HALO_MAX_SCALE = 1.8

/**
 * El Libro de Rosa as a small, self-lit hero object for the HUD's own canvas:
 * the "Historia del Barrio Abajo" hardcover standing in a warm halo and a
 * ring of sparks — showing its cover, swaying, while calm; spinning and
 * shaking harder as the portal nears — plus a
 * gilded ring that flares around it. Every stage change is eased, so the book
 * never snaps between beats.
 *
 * @param props - Current stage
 * @returns Book group
 */
export const StoryBook3D = memo(function StoryBook3D({ stage }: StoryBook3DProps) {
  const rootRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Sprite>(null)
  const haloTexture = useMemo(() => createHaloTexture(), [])
  const lightRef = useRef<THREE.PointLight>(null)
  const sparksRef = useRef<THREE.Points>(null)
  const state = useRef({ spin: 0, jitter: 0, glow: 0.4, angle: 0, kick: 0, kickTimer: 0 })

  const sparkPositions = useMemo(() => {
    const arr = new Float32Array(60 * 3)
    for (let i = 0; i < 60; i++) {
      const r = 0.55 + Math.random() * 0.35
      const theta = Math.random() * Math.PI * 2
      arr[i * 3] = Math.cos(theta) * r
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1.2
      arr[i * 3 + 2] = Math.sin(theta) * r
    }
    return arr
  }, [])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    const s = state.current
    const target = STAGE_TARGETS[stage]
    s.spin = THREE.MathUtils.damp(s.spin, target.spin, 2.4, dt)
    s.jitter = THREE.MathUtils.damp(s.jitter, target.jitter, 4, dt)
    s.glow = THREE.MathUtils.damp(s.glow, target.glow, 3, dt)

    s.kickTimer -= dt
    if (s.jitter > 0.2 && s.kickTimer <= 0) {
      s.kick = (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 10) * s.jitter
      s.kickTimer = 0.25 + Math.random() * 0.45
    }
    s.kick = THREE.MathUtils.damp(s.kick, 0, 5, dt)
    if (s.spin < 0.3 && s.jitter < 0.2) {
      const home = Math.round(s.angle / (Math.PI * 2)) * Math.PI * 2 + Math.sin(t * 0.7) * 0.32
      s.angle = THREE.MathUtils.damp(s.angle, home, 2, dt)
    } else {
      s.angle += (s.spin + s.kick) * dt
    }

    const root = rootRef.current
    if (root) {
      root.rotation.y = s.angle
      root.rotation.z = Math.sin(t * 0.8) * 0.06 + Math.sin(t * 23) * 0.12 * s.jitter
      root.rotation.x = Math.sin(t * 0.6) * 0.08 + Math.sin(t * 17 + 1.3) * 0.1 * s.jitter
      root.position.y = Math.sin(t * 1.4) * 0.07 + Math.sin(t * 31) * 0.035 * s.jitter
      root.position.x = Math.sin(t * 27) * 0.03 * s.jitter
    }
    if (ringRef.current) {
      const ring = 1 + Math.sin(t * 2.4) * 0.04 + s.glow * 0.06
      ringRef.current.scale.setScalar(ring)
      ringRef.current.rotation.z = t * (0.5 + s.spin * 0.05)
      ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.min(0.9, 0.25 + s.glow * 0.2)
    }
    if (glowRef.current) {
      const g = Math.min(HALO_MAX_SCALE, 1.5 + s.glow * 0.18 + Math.sin(t * 2.2) * 0.05)
      glowRef.current.scale.set(g, g, 1)
      glowRef.current.material.opacity = Math.min(1, 0.45 + s.glow * 0.18)
    }
    if (lightRef.current) lightRef.current.intensity = 1.6 + s.glow * 2.2
    if (sparksRef.current) {
      sparksRef.current.rotation.y = -t * (0.3 + s.spin * 0.08)
      const mat = sparksRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.45 + Math.min(s.glow, 2.5) * 0.2
      mat.size = 0.03 + Math.min(s.glow, 2.5) * 0.01
    }
  })

  return (
    <group>
      <ambientLight intensity={0.55} color="#ffe9c4" />
      <directionalLight position={[2, 3, 4]} intensity={1.4} color="#fff4d0" />
      <pointLight ref={lightRef} position={[0, 0, 1.2]} intensity={2} distance={6} color="#ffcc66" decay={2} />

      <sprite ref={glowRef} position={[0, 0, -0.4]}>
        <spriteMaterial map={haloTexture} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      <points ref={sparksRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#ffe9a0" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>

      <mesh ref={ringRef} position={[0, 0, -0.25]}>
        <torusGeometry args={[0.7, 0.012, 8, 96]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      <group ref={rootRef}>
        <RosaBookModel height={BOOK_HEIGHT} castShadow={false} />
      </group>
    </group>
  )
})
