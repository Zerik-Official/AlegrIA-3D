import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StoryBookStage } from '@/app/hooks/useStoryBookFlow'

/**
 * Props for {@link StoryBook3D}.
 */
interface StoryBook3DProps {
  /** Beat of the choreography — drives spin, opening and page flipping. */
  stage: StoryBookStage
}

/** Page (and cover) width, from the spine outwards. */
const PAGE_W = 0.72
/** Page (and cover) height. */
const PAGE_H = 0.98
/** How many loose pages flip while the book is restless. */
const FLIP_PAGES = 7

/** Target values each stage eases towards. */
const STAGE_TARGETS: Record<StoryBookStage, { open: number; spin: number; jitter: number; glow: number; flip: number }> = {
  hidden: { open: 0.25, spin: 0.6, jitter: 0, glow: 0.4, flip: 0 },
  calm: { open: 0.25, spin: 0.6, jitter: 0, glow: 0.55, flip: 0 },
  restless: { open: 2.7, spin: 5.2, jitter: 1, glow: 1.6, flip: 1 },
  summoning: { open: 3.0, spin: 11, jitter: 0.35, glow: 2.6, flip: 1 },
  portal: { open: 3.0, spin: 14, jitter: 0, glow: 3.2, flip: 1 },
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
const HALO_MAX_SCALE = 2

/** Shared materials so the page stack doesn't allocate one per page. */
const materials = {
  cover: new THREE.MeshStandardMaterial({ color: '#8b1a3a', roughness: 0.42, metalness: 0.18 }),
  backCover: new THREE.MeshStandardMaterial({ color: '#5b0f1f', roughness: 0.52, metalness: 0.12 }),
  block: new THREE.MeshStandardMaterial({ color: '#f5e6c8', roughness: 0.9 }),
  page: new THREE.MeshStandardMaterial({ color: '#fff8e0', roughness: 1, side: THREE.DoubleSide }),
  gold: new THREE.MeshStandardMaterial({ color: '#c9a86a', metalness: 0.8, roughness: 0.2 }),
  sigil: new THREE.MeshStandardMaterial({ color: '#ffcc33', emissive: '#ffb400', emissiveIntensity: 1, side: THREE.DoubleSide }),
}

/**
 * El Libro de Rosa as a small, self-lit hero object for the HUD's own canvas:
 * a standing hardcover whose front cover swings open on a spine hinge and
 * whose loose pages flip one after another while it is restless. Every
 * stage change is eased, so the book never snaps between beats.
 *
 * @param props - Current stage
 * @returns Book group
 */
export const StoryBook3D = memo(function StoryBook3D({ stage }: StoryBook3DProps) {
  const rootRef = useRef<THREE.Group>(null)
  const coverRef = useRef<THREE.Group>(null)
  const pageRefs = useRef<THREE.Group[]>([])
  const glowRef = useRef<THREE.Sprite>(null)
  const haloTexture = useMemo(() => createHaloTexture(), [])
  const lightRef = useRef<THREE.PointLight>(null)
  const sparksRef = useRef<THREE.Points>(null)
  const state = useRef({ open: 0.25, spin: 0.6, jitter: 0, glow: 0.4, flip: 0, angle: 0, kick: 0, kickTimer: 0 })

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
    s.open = THREE.MathUtils.damp(s.open, target.open, 3.2, dt)
    s.spin = THREE.MathUtils.damp(s.spin, target.spin, 2.4, dt)
    s.jitter = THREE.MathUtils.damp(s.jitter, target.jitter, 4, dt)
    s.glow = THREE.MathUtils.damp(s.glow, target.glow, 3, dt)
    s.flip = THREE.MathUtils.damp(s.flip, target.flip, 3, dt)

    s.kickTimer -= dt
    if (s.jitter > 0.2 && s.kickTimer <= 0) {
      s.kick = (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 10) * s.jitter
      s.kickTimer = 0.25 + Math.random() * 0.45
    }
    s.kick = THREE.MathUtils.damp(s.kick, 0, 5, dt)
    s.angle += (s.spin + s.kick) * dt

    const root = rootRef.current
    if (root) {
      root.rotation.y = s.angle
      root.rotation.z = Math.sin(t * 0.8) * 0.06 + Math.sin(t * 23) * 0.12 * s.jitter
      root.rotation.x = Math.sin(t * 0.6) * 0.08 + Math.sin(t * 17 + 1.3) * 0.1 * s.jitter
      root.position.y = Math.sin(t * 1.4) * 0.07 + Math.sin(t * 31) * 0.035 * s.jitter
      root.position.x = Math.sin(t * 27) * 0.03 * s.jitter
    }
    if (coverRef.current) coverRef.current.rotation.y = -s.open
    for (let i = 0; i < pageRefs.current.length; i++) {
      const page = pageRefs.current[i]
      if (!page) continue
      const cycle = (t * 1.35 + i / FLIP_PAGES) % 1
      const flipped = THREE.MathUtils.smoothstep(cycle, 0.1, 0.9) * (Math.PI - 0.12) + 0.06
      const rest = 0.04 + i * 0.012
      page.rotation.y = -THREE.MathUtils.lerp(rest, Math.min(flipped, s.open - 0.05), s.flip)
      page.visible = s.flip > 0.02
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

      <group ref={rootRef}>
        <group position={[-PAGE_W / 2, 0, 0]}>
          <mesh position={[PAGE_W / 2, 0, -0.07]} material={materials.backCover}>
            <boxGeometry args={[PAGE_W + 0.04, PAGE_H + 0.04, 0.035]} />
          </mesh>
          <mesh position={[0, 0, -0.035]} material={materials.backCover}>
            <boxGeometry args={[0.05, PAGE_H + 0.04, 0.1]} />
          </mesh>
          <mesh position={[PAGE_W / 2 - 0.01, 0, -0.03]} material={materials.block}>
            <boxGeometry args={[PAGE_W - 0.03, PAGE_H - 0.03, 0.05]} />
          </mesh>

          {Array.from({ length: FLIP_PAGES }).map((_, i) => (
            <group
              key={i}
              ref={(el) => {
                if (el) pageRefs.current[i] = el
              }}
              position={[0, 0, -0.002 + i * 0.001]}
            >
              <mesh position={[PAGE_W / 2 - 0.02, 0, 0]} material={materials.page}>
                <planeGeometry args={[PAGE_W - 0.05, PAGE_H - 0.05]} />
              </mesh>
            </group>
          ))}

          <group ref={coverRef} position={[0, 0, 0.012]}>
            <mesh position={[PAGE_W / 2, 0, 0]} material={materials.cover}>
              <boxGeometry args={[PAGE_W + 0.04, PAGE_H + 0.04, 0.035]} />
            </mesh>
            {[
              [PAGE_W - 0.05, PAGE_H / 2 - 0.05],
              [PAGE_W - 0.05, -PAGE_H / 2 + 0.05],
            ].map(([x, y], i) => (
              <mesh key={i} position={[x, y, 0.02]} material={materials.gold}>
                <boxGeometry args={[0.08, 0.08, 0.01]} />
              </mesh>
            ))}
            <mesh position={[PAGE_W / 2, 0, 0.019]} material={materials.sigil}>
              <ringGeometry args={[0.13, 0.16, 40]} />
            </mesh>
            <mesh position={[PAGE_W / 2, 0, 0.02]} material={materials.sigil}>
              <circleGeometry args={[0.05, 32]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
})
