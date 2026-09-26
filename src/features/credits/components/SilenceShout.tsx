/**
 * "Chicos, silencio porfaa" — 3D lettering that pops up next to Jafet every
 * {@link SHOUT_INTERVAL_S} seconds, wobbles for a moment facing the orbiting
 * camera, and shrinks away again.
 * @module features/credits/components/SilenceShout
 */

import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Center, Text3D } from '@react-three/drei'
import * as THREE from 'three'
import { CREDITS_SHOUT_TEXT } from '@/features/credits/config/creditsConfig'

/** Typeface with Spanish accents, served from `public/fonts`. */
const FONT_URL = `${import.meta.env.BASE_URL}fonts/droid_sans_bold.typeface.json`
/** Seconds between appearances. */
const SHOUT_INTERVAL_S = 30
/** Seconds each appearance lasts, entrance and exit included. */
const SHOUT_DURATION_S = 4
/** Seconds the pop-in and the shrink-out each take. */
const SHOUT_EASE_S = 0.45

/**
 * @param x - Progress `[0, 1]`
 * @returns Back-out easing, overshooting a little before settling
 */
function easeOutBack(x: number): number {
  const c = 1.9
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
}

/**
 * Props for {@link SilenceShout}.
 */
interface SilenceShoutProps {
  /** Where the lettering floats, relative to Jafet. */
  position: [number, number, number]
}

/**
 * @param props - Placement
 * @returns Camera-facing 3D text, hidden between appearances
 */
export const SilenceShout = memo(function SilenceShout({ position }: SilenceShoutProps) {
  const groupRef = useRef<THREE.Group>(null)
  const startRef = useRef<number | null>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    startRef.current ??= clock.elapsedTime
    const elapsed = clock.elapsedTime - startRef.current
    const cycle = elapsed % SHOUT_INTERVAL_S
    const active = cycle >= SHOUT_INTERVAL_S - SHOUT_DURATION_S
    group.visible = active
    if (!active) return
    const local = cycle - (SHOUT_INTERVAL_S - SHOUT_DURATION_S)
    const enter = THREE.MathUtils.clamp(local / SHOUT_EASE_S, 0, 1)
    const exit = THREE.MathUtils.clamp((SHOUT_DURATION_S - local) / SHOUT_EASE_S, 0, 1)
    const scale = Math.max(0.001, easeOutBack(enter) * THREE.MathUtils.smoothstep(exit, 0, 1))
    group.scale.setScalar(scale)
    group.rotation.z = Math.sin(local * 9) * 0.06 * (1 - enter * 0.5)
    group.position.y = Math.sin(local * 3) * 0.05
  })

  return (
    <group position={position}>
      <Billboard>
        <group ref={groupRef} visible={false}>
          <Center>
            <Text3D font={FONT_URL} size={0.2} height={0.07} curveSegments={6} bevelEnabled bevelThickness={0.012} bevelSize={0.008} bevelSegments={2}>
              {CREDITS_SHOUT_TEXT}
              <meshStandardMaterial color="#ffcc33" emissive="#ff007f" emissiveIntensity={0.55} metalness={0.35} roughness={0.35} />
            </Text3D>
          </Center>
        </group>
      </Billboard>
    </group>
  )
})