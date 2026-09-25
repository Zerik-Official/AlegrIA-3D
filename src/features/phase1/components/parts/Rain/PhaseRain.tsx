import { memo, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RainStreaks } from '@/features/phase1/components/parts/Rain/RainStreaks'
import { RainSplashes } from '@/features/phase1/components/parts/Rain/RainSplashes'
import { RainPuddles } from '@/features/phase1/components/parts/Rain/RainPuddles'
import { RainSky } from '@/features/phase1/components/parts/Rain/RainSky'
import { appConfig } from '@/shared/config/appConfig'

/**
 * Props for {@link PhaseRain}.
 */
interface PhaseRainProps {
  /** Whether it's raining; the rain builds up and eases off gradually either way. */
  active: boolean
}

/**
 * Phase 1's rain: drops falling around the player, ripples springing up on
 * the ground, puddles gathering (and mirroring the barrio) and the sky
 * turning overcast — all driven by one strength that eases from a first
 * drizzle to the full downpour over `rainConfig.buildUpSec`.
 *
 * @param props - Whether it's raining
 * @returns Rain group, or `null` before the first drop
 */
export const PhaseRain = memo(function PhaseRain({ active }: PhaseRainProps) {
  const intensity = useRef(0)
  const [started, setStarted] = useState(active)

  useEffect(() => {
    if (active) setStarted(true)
  }, [active])

  useFrame((_, delta) => {
    const target = active ? 1 : 0
    const step = Math.min(delta, 0.05) / appConfig.rain.buildUpSec
    intensity.current = THREE.MathUtils.clamp(intensity.current + Math.sign(target - intensity.current) * step, 0, 1)
  })

  if (!started) return null

  return (
    <group>
      <RainSky intensity={intensity} />
      <RainStreaks count={appConfig.rain.dropCount} intensity={intensity} />
      <RainSplashes count={appConfig.rain.splashCount} intensity={intensity} />
      <RainPuddles intensity={intensity} reflections={appConfig.rain.puddleReflections} />
    </group>
  )
})
