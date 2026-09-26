import { memo, useEffect, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link RainSky}.
 */
interface RainSkyProps {
  /** Current rain strength `[0,1]`, eased by `PhaseRain`. */
  intensity: MutableRefObject<number>
}

/** The overcast look the scene's fog and background drift towards at full rain. */
const OVERCAST = { fog: new THREE.Color('#646a72'), near: 10, far: 95, background: new THREE.Color('#5d656f') }

/**
 * Overcast skies for the rain: pulls the scene's fog in and greys it, along
 * with the background, in step with the rain's strength — and hands back the
 * original sky when the rain component goes away.
 *
 * @param props - Live intensity
 * @returns Null (side-effect only)
 */
export const RainSky = memo(function RainSky({ intensity }: RainSkyProps) {
  const original = useRef<{ scene: THREE.Scene; fog: THREE.Fog; color: THREE.Color; near: number; far: number; background: THREE.Color | null } | null>(null)

  useEffect(
    () => () => {
      const o = original.current
      if (!o) return
      o.fog.color.copy(o.color)
      o.fog.near = o.near
      o.fog.far = o.far
      if (o.background && o.scene.background instanceof THREE.Color) o.scene.background.copy(o.background)
    },
    []
  )

  useFrame(({ scene }) => {
    const fog = scene.fog
    if (!(fog instanceof THREE.Fog)) return
    if (!original.current || original.current.fog !== fog) {
      original.current = {
        scene,
        fog,
        color: fog.color.clone(),
        near: fog.near,
        far: fog.far,
        background: scene.background instanceof THREE.Color ? scene.background.clone() : null,
      }
    }
    const o = original.current
    const k = intensity.current
    fog.color.copy(o.color).lerp(OVERCAST.fog, k)
    fog.near = THREE.MathUtils.lerp(o.near, OVERCAST.near, k)
    fog.far = THREE.MathUtils.lerp(o.far, OVERCAST.far, k)
    if (o.background && scene.background instanceof THREE.Color) scene.background.copy(o.background).lerp(OVERCAST.background, k)
  })

  return null
})
