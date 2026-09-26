/**
 * `concert-stage` entity renderer: the street party's big finish at the end
 * of the side street by RIWI's headquarters. A raised stage framed by truss
 * towers, RIWI's fox dancing center stage before a video wall that lights up
 * with the tour video once the mototaxi arrives, speaker stacks throwing
 * rings of sound, laser moving-heads sweeping everything, a screen hovering
 * overhead with the music's equalizer, three screens drifting over the crowd
 * with the partners' logos, flying speakers trailing notes, and a crowd in
 * front waving light sticks. The stage faces local `+Z`, the audience
 * standing there; the music itself comes from `CarnivalMusicSystem`.
 * @module features/cityIntro/renderers/concert/ConcertStageRenderer
 */

import { memo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { beatAt, CARNIVAL_NEON } from '@/features/cityIntro/config/carnivalLayout'
import { LocalDanceCrowd } from '@/features/cityIntro/components/carnival/LocalDanceCrowd'
import { RiwiFoxDancer } from '@/features/cityIntro/renderers/concert/RiwiFoxDancer'
import { FlyingEqualizerScreen } from '@/features/cityIntro/renderers/concert/FlyingEqualizerScreen'
import { FlyingSpeaker, LaserRig, SpeakerStack } from '@/features/cityIntro/renderers/concert/ConcertEffects'
import { StageVideoWall } from '@/features/cityIntro/renderers/concert/StageVideoWall'
import { PartnerScreens } from '@/features/cityIntro/renderers/concert/PartnerScreens'
import { GlowSprite, GroundGlow } from '@/shared/components/LightGlows'

/** Stage deck: width (X), depth (Z), height, and its front edge's Z. */
const DECK_W = 13
const DECK_D = 6
const DECK_H = 1.2
const DECK_FRONT_Z = 2
/** Height of the top truss. */
const TRUSS_H = 7.6
/** Crowd's center in front of the stage, and its spread. */
const CROWD_CENTER: [number, number, number] = [0, 0, 8.2]
const CROWD_RADIUS = 5.4
/** Laser fixtures along the top truss. */
const LASER_FIXTURES: Array<[number, number, number]> = [-5.4, -3.2, -1.1, 1.1, 3.2, 5.4].map((x) => [x, TRUSS_H - 0.35, DECK_FRONT_Z - 1.5])
/** Where the three partner screens hover over the crowd. */
const PARTNER_SCREENS: Array<[number, number, number]> = [
  [-2.4, 7.2, 7.5],
  [0, 8.6, 11.5],
  [2.4, 7.2, 7.5],
]
/** Colored pools pulsing on the crowd's floor. */
const FLOOR_POOLS: Array<{ position: [number, number, number]; color: string }> = [
  { position: [-3.6, 0.04, 6.5], color: '#FF007F' },
  { position: [0, 0.04, 8.5], color: '#49E9FF' },
  { position: [3.6, 0.04, 6.5], color: '#FFB703' },
  { position: [-2.2, 0.04, 11], color: '#39FF88' },
  { position: [2.4, 0.04, 11], color: '#A855FF' },
]

/**
 * A square truss tower.
 * @param props - Base position
 * @returns Tower
 */
function TrussTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-0.25, 0.25].map((x) =>
        [-0.25, 0.25].map((z) => (
          <mesh key={`${x}${z}`} position={[x, TRUSS_H / 2, z]}>
            <cylinderGeometry args={[0.05, 0.05, TRUSS_H, 6]} />
            <meshStandardMaterial color="#9aa3b5" metalness={0.9} roughness={0.25} />
          </mesh>
        ))
      )}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 0.5 + i * 0.95, 0]} rotation-z={i % 2 ? 0.6 : -0.6}>
          <boxGeometry args={[0.62, 0.035, 0.035]} />
          <meshStandardMaterial color="#9aa3b5" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * The concert's only real light: a follow spot from the truss onto the fox.
 * Its target lives in the scene graph so it follows the stage's transform.
 * @returns Spot light and its target
 */
function StageSpot() {
  const [target] = useState(() => new THREE.Object3D())
  return (
    <>
      <primitive object={target} position={[0, DECK_H + 1, DECK_FRONT_Z - 2.2]} />
      <spotLight position={[0, TRUSS_H - 0.4, DECK_FRONT_Z + 3]} target={target} angle={0.5} penumbra={0.6} intensity={60} distance={22} decay={2} color="#ffe6f6" />
    </>
  )
}

/**
 * Deck edge strip and floor pools that pulse on the beat, cycling colors.
 * @returns Pulsing glows
 */
function BeatGlows() {
  const stripRef = useRef<THREE.Mesh>(null)
  const poolRefs = useRef<Array<THREE.Mesh | null>>([])
  const color = useRef(new THREE.Color())

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const { beat, kick } = beatAt(t)
    const strip = stripRef.current
    if (strip) {
      const material = strip.material as THREE.MeshBasicMaterial
      material.color.copy(color.current.set(CARNIVAL_NEON[Math.floor(beat) % CARNIVAL_NEON.length])).multiplyScalar(0.6 + kick * 0.8)
    }
    poolRefs.current.forEach((pool, i) => {
      if (pool) (pool.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.3 * Math.pow(0.5 + 0.5 * Math.sin(beat * Math.PI + i * 1.3), 2)
    })
  })

  return (
    <>
      <mesh ref={stripRef} position={[0, DECK_H + 0.02, DECK_FRONT_Z + 0.02]}>
        <boxGeometry args={[DECK_W, 0.08, 0.06]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      {FLOOR_POOLS.map((pool, i) => (
        <GroundGlow
          key={i}
          ref={(el) => {
            poolRefs.current[i] = el
          }}
          color={pool.color}
          radius={3.4}
          opacity={0.3}
          position={pool.position}
        />
      ))}
    </>
  )
}

/**
 * @returns Concert group, in the entity's local space
 */
export const ConcertStageRenderer = memo(function ConcertStageRenderer() {
  return (
    <group>
      <mesh position={[0, DECK_H / 2, DECK_FRONT_Z - DECK_D / 2]} castShadow receiveShadow>
        <boxGeometry args={[DECK_W, DECK_H, DECK_D]} />
        <meshStandardMaterial color="#141722" roughness={0.55} metalness={0.4} />
      </mesh>
      <mesh position={[0, DECK_H + 0.3, DECK_FRONT_Z - DECK_D + 0.3]} castShadow>
        <boxGeometry args={[DECK_W - 1, 0.6, 0.6]} />
        <meshStandardMaterial color="#0e1018" roughness={0.6} />
      </mesh>
      <mesh position={[0, DECK_H + 3.4, DECK_FRONT_Z - DECK_D - 0.1]}>
        <planeGeometry args={[DECK_W, 6.8]} />
        <meshStandardMaterial color="#090a12" emissive="#2a0f4a" emissiveIntensity={0.6} roughness={0.8} />
      </mesh>
      <StageVideoWall position={[0, DECK_H + 3.4, DECK_FRONT_Z - DECK_D - 0.02]} />
      {[-4.5, 4.5].map((x) => (
        <mesh key={x} position={[x, DECK_H + 3.4, DECK_FRONT_Z - DECK_D - 0.05]}>
          <boxGeometry args={[0.08, 6.4, 0.05]} />
          <meshBasicMaterial color="#a855ff" toneMapped={false} />
        </mesh>
      ))}

      <TrussTower position={[-DECK_W / 2 - 0.4, 0, DECK_FRONT_Z - 1.5]} />
      <TrussTower position={[DECK_W / 2 + 0.4, 0, DECK_FRONT_Z - 1.5]} />
      <mesh position={[0, TRUSS_H, DECK_FRONT_Z - 1.5]}>
        <boxGeometry args={[DECK_W + 1.4, 0.5, 0.5]} />
        <meshStandardMaterial color="#9aa3b5" metalness={0.9} roughness={0.25} wireframe />
      </mesh>

      <group position={[0, DECK_H, DECK_FRONT_Z - 2.2]}>
        <RiwiFoxDancer height={2.8} />
      </group>
      <StageSpot />
      <GlowSprite color="#ffe6f6" size={2.4} opacity={0.5} position={[0, TRUSS_H - 0.4, DECK_FRONT_Z + 3]} />

      <SpeakerStack position={[-DECK_W / 2 + 1, DECK_H, DECK_FRONT_Z - 0.8]} color="#FF007F" />
      <SpeakerStack position={[DECK_W / 2 - 1, DECK_H, DECK_FRONT_Z - 0.8]} color="#49E9FF" />
      <SpeakerStack position={[-DECK_W / 2 - 1.8, 0, DECK_FRONT_Z + 0.4]} color="#FFB703" />
      <SpeakerStack position={[DECK_W / 2 + 1.8, 0, DECK_FRONT_Z + 0.4]} color="#39FF88" />

      <LaserRig fixtures={LASER_FIXTURES} />
      <FlyingEqualizerScreen position={[0, TRUSS_H + 3.2, DECK_FRONT_Z + 1.5]} tilt={0.42} />
      <FlyingSpeaker position={[-8.5, 6.2, DECK_FRONT_Z + 2]} color="#FF007F" phase={0} />
      <FlyingSpeaker position={[8.5, 6.8, DECK_FRONT_Z + 2]} color="#49E9FF" phase={2.1} />
      <FlyingSpeaker position={[0, 9.5, DECK_FRONT_Z - 5]} color="#FFB703" phase={4.2} />

      <group position={CROWD_CENTER}>
        <LocalDanceCrowd count={64} radius={CROWD_RADIUS} exclude={0.6} armChance={0.7} glowsticks />
      </group>
      <PartnerScreens positions={PARTNER_SCREENS} />
      <BeatGlows />
    </group>
  )
})
