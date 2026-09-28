/**
 * The concert's show effects, all unlit and additive so they cost no real
 * lights: laser moving-heads sweeping the stage and crowd, speaker stacks
 * throwing rings of sound on the beat, and flying speakers trailing music
 * notes.
 * @module features/cityIntro/renderers/concert/ConcertEffects
 */

import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { beatAt } from '@/features/cityIntro/config/carnivalLayout'
import { GlowSprite } from '@/shared/components/LightGlows'

/** Laser colors, cycled across the rig. */
const LASER_COLORS = ['#49E9FF', '#FF007F', '#39FF88', '#FFB703', '#A855FF', '#2E9BFF']
/** Length of a laser beam. */
const LASER_LENGTH = 26

/**
 * Props for {@link LaserRig}.
 */
interface LaserRigProps {
  /** Fixture positions, along the top truss. */
  fixtures: Array<[number, number, number]>
}

/**
 * Moving-head fixtures hanging from the truss, each shooting a thin laser
 * and a soft wide beam that sweep across the stage and the crowd.
 * @param props - Fixture positions
 * @returns Laser rig
 */
export const LaserRig = memo(function LaserRig({ fixtures }: LaserRigProps) {
  const headRefs = useRef<Array<THREE.Group | null>>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const { kick } = beatAt(t)
    headRefs.current.forEach((head, i) => {
      if (!head) return
      const phase = i * 1.3
      head.rotation.set(-0.55 + Math.sin(t * 0.7 + phase) * 0.45, Math.sin(t * 0.45 + phase) * 0.9, 0)
      const beam = head.children[0] as THREE.Mesh | undefined
      const cone = head.children[1] as THREE.Mesh | undefined
      if (beam) (beam.material as THREE.MeshBasicMaterial).opacity = 0.55 + kick * 0.4
      if (cone) (cone.material as THREE.MeshBasicMaterial).opacity = 0.05 + kick * 0.05
    })
  })

  return (
    <group>
      {fixtures.map((position, i) => {
        const color = LASER_COLORS[i % LASER_COLORS.length]
        return (
          <group key={i} position={position}>
            <mesh>
              <boxGeometry args={[0.45, 0.35, 0.45]} />
              <meshStandardMaterial color="#12141c" metalness={0.8} roughness={0.3} />
            </mesh>
            <GlowSprite color={color} size={1.2} opacity={0.7} position={[0, -0.25, 0]} />
            <group
              ref={(el) => {
                headRefs.current[i] = el
              }}
            >
              <mesh position={[0, -LASER_LENGTH / 2, 0]}>
                <cylinderGeometry args={[0.025, 0.025, LASER_LENGTH, 6, 1, true]} />
                <meshBasicMaterial color={color} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
              <mesh position={[0, -7, 0]}>
                <coneGeometry args={[1.6, 14, 18, 1, true]} />
                <meshBasicMaterial color={color} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
})

/** Rings each speaker keeps in flight at once. */
const RINGS_PER_SPEAKER = 3

/**
 * Props for {@link SpeakerStack}.
 */
interface SpeakerStackProps {
  /** Stack position (its base). */
  position: [number, number, number]
  /** Ring color. */
  color: string
}

/**
 * A tower of speaker cabinets whose woofers throw expanding rings of sound
 * forward (`+Z`) on the beat.
 * @param props - Placement and ring color
 * @returns Speaker stack
 */
export const SpeakerStack = memo(function SpeakerStack({ position, color }: SpeakerStackProps) {
  const ringRefs = useRef<Array<THREE.Mesh | null>>([])
  const coneRefs = useRef<Array<THREE.Mesh | null>>([])
  const woofers: Array<[number, number]> = [
    [0, 0.65],
    [0, 1.85],
  ]

  useFrame(({ clock }) => {
    const { beat, kick } = beatAt(clock.elapsedTime)
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return
      const life = (beat * 0.5 + (i % RINGS_PER_SPEAKER) / RINGS_PER_SPEAKER) % 1
      ring.scale.setScalar(0.4 + life * 3.2)
      ring.position.z = 0.55 + life * 2.4
      ;(ring.material as THREE.MeshBasicMaterial).opacity = (1 - life) * 0.75
    })
    coneRefs.current.forEach((cone) => {
      if (cone) cone.scale.setScalar(1 + kick * 0.12)
    })
  })

  return (
    <group position={position}>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[1.3, 2.5, 1]} />
        <meshStandardMaterial color="#0d0f16" roughness={0.6} metalness={0.3} />
      </mesh>
      {woofers.map(([x, y], w) => (
        <group key={w} position={[x, y, 0.51]}>
          <mesh
            ref={(el) => {
              coneRefs.current[w] = el
            }}
          >
            <circleGeometry args={[0.42, 28]} />
            <meshStandardMaterial color="#1c1f2a" emissive={color} emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
          {Array.from({ length: RINGS_PER_SPEAKER }, (_, r) => (
            <mesh
              key={r}
              ref={(el) => {
                ringRefs.current[w * RINGS_PER_SPEAKER + r] = el
              }}
            >
              <ringGeometry args={[0.36, 0.42, 36]} />
              <meshBasicMaterial color={color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
})

/** Notes each flying speaker keeps in the air. */
const NOTES_PER_SPEAKER = 14
/** Height the notes rise before fading out. */
const NOTE_RISE = 3.2

const NOTE_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    float life = fract(uTime * 0.28 + aSeed);
    vec3 p = position;
    p.y += life * ${NOTE_RISE.toFixed(1)};
    p.x += sin(life * 6.2831 + aSeed * 20.0) * 0.35;
    vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.65, 1.0, life));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = 170.0 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const NOTE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(uColor, tex.a * vAlpha);
  }
`

/** Shared music-note sprite, created on first use. */
let noteTexture: THREE.CanvasTexture | null = null

/**
 * @returns White "♪" glyph texture
 */
function getNoteTexture(): THREE.CanvasTexture {
  if (noteTexture) return noteTexture
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('♪', 32, 34)
  noteTexture = new THREE.CanvasTexture(canvas)
  return noteTexture
}

/**
 * Props for {@link FlyingSpeaker}.
 */
interface FlyingSpeakerProps {
  /** Center of the speaker's hover orbit. */
  position: [number, number, number]
  /** Accent and note color. */
  color: string
  /** Offsets its bob and orbit from the others'. */
  phase: number
}

/**
 * A speaker cabinet floating on its thrusters, bobbing and slowly circling,
 * with music notes drifting up off it.
 * @param props - Orbit center, color and phase
 * @returns Flying speaker
 */
export const FlyingSpeaker = memo(function FlyingSpeaker({ position, color, phase }: FlyingSpeakerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const notesRef = useRef<THREE.Points>(null)
  const noteData = useMemo(() => {
    const positions = new Float32Array(NOTES_PER_SPEAKER * 3)
    const seeds = new Float32Array(NOTES_PER_SPEAKER)
    for (let i = 0; i < NOTES_PER_SPEAKER; i++) {
      positions.set([((i % 5) - 2) * 0.18, 0.7, (((i * 7) % 5) - 2) * 0.12], i * 3)
      seeds[i] = i / NOTES_PER_SPEAKER
    }
    return { positions, seeds }
  }, [])
  const noteMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uMap: { value: getNoteTexture() }, uColor: { value: new THREE.Color(color) } },
        vertexShader: NOTE_VERTEX,
        fragmentShader: NOTE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color]
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const group = groupRef.current
    if (group) {
      group.position.set(position[0] + Math.cos(t * 0.25 + phase) * 1.4, position[1] + Math.sin(t * 1.3 + phase) * 0.3, position[2] + Math.sin(t * 0.25 + phase) * 1.4)
      group.rotation.y = Math.sin(t * 0.4 + phase) * 0.5
      const kick = beatAt(t).kick
      group.scale.setScalar(1 + kick * 0.05)
    }
    const notes = notesRef.current
    if (notes) (notes.material as THREE.ShaderMaterial).uniforms.uTime.value = t + phase
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <boxGeometry args={[0.9, 1.2, 0.8]} />
        <meshStandardMaterial color="#10131c" metalness={0.6} roughness={0.35} emissive={color} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.15, 0.41]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <GlowSprite color={color} size={1.6} opacity={0.45} position={[0, -0.75, 0]} />
      <points ref={notesRef} material={noteMaterial} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[noteData.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[noteData.seeds, 1]} />
        </bufferGeometry>
      </points>
    </group>
  )
})
