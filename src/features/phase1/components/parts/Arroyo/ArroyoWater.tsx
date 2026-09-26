/**
 * Stylized, noise-textured water surface for the arroyo
 * @module features/phase1/components/parts/Arroyo/ArroyoWater
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildLoftGeometry } from '@/features/phase1/components/parts/Arroyo/riverPath'
import { arroyoWaterConfig } from '@/features/phase1/config/arroyoWater'
import { createStylizedWaterMaterial } from '@/features/phase1/materials/stylizedWaterMaterial'

/** Props for {@link ArroyoWater}. */
interface ArroyoWaterProps {
  /** River centerline the water ribbon follows. */
  curve: THREE.CatmullRomCurve3
  /** Ribbon width. */
  width: number
  /** World Y the water surface sits at. */
  y: number
}

/**
 * @param props - Curve, width and height the water ribbon is built at
 * @returns Water mesh
 */
export function ArroyoWater({ curve, width, y }: ArroyoWaterProps) {
  const geometry = useMemo(
    () => buildLoftGeometry(curve, [{ offset: -width / 2, y }, { offset: width / 2, y }]),
    [curve, width, y]
  )

  const material = useMemo(
    () =>
      createStylizedWaterMaterial({
        colorNear: arroyoWaterConfig.colorNear,
        colorFar: arroyoWaterConfig.colorFar,
        textureSize: arroyoWaterConfig.textureSize,
        waveSpeed: arroyoWaterConfig.waveSpeed,
        waveAmplitude: arroyoWaterConfig.waveAmplitude,
        edgeFadeStart: arroyoWaterConfig.bankFadeStart,
        edgeFadeEnd: arroyoWaterConfig.bankFadeEnd,
        edgeAxis: [0, 1],
      }),
    []
  )

  const waterRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const water = waterRef.current
    if (water) (water.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh ref={waterRef} geometry={geometry} receiveShadow frustumCulled={false}>
      <primitive object={material} attach="material" />
    </mesh>
  )
}
