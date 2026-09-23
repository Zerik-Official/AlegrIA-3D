/**
 * Periodic street flood — every {@link phase1FloodConfig.cycleSeconds}
 * seconds the whole map briefly floods to knee height, then recedes.
 * @module features/phase1/components/parts/Phase1Flood
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { phase1FloodConfig } from '@/features/phase1/config/phase1Flood'
import { createStylizedWaterMaterial } from '@/features/phase1/materials/stylizedWaterMaterial'

/**
 * @returns Flood plane, hidden below the ground except during its flood window
 */
export function Phase1Flood() {
  const meshRef = useRef<THREE.Mesh>(null)

  const material = useMemo(
    () =>
      createStylizedWaterMaterial({
        colorNear: phase1FloodConfig.colorNear,
        colorFar: phase1FloodConfig.colorFar,
        textureSize: phase1FloodConfig.textureSize,
        waveSpeed: phase1FloodConfig.waveSpeed,
        waveAmplitude: phase1FloodConfig.waveAmplitude,
        edgeFadeStart: phase1FloodConfig.edgeFadeStart,
        edgeFadeEnd: phase1FloodConfig.edgeFadeEnd,
        edgeAxis: [1, 1],
      }),
    []
  )

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime

    const mesh = meshRef.current
    if (!mesh) return

    const { cycleSeconds, riseDuration, holdDuration, recedeDuration, hiddenLevel, floodLevel } = phase1FloodConfig
    const t = clock.elapsedTime % cycleSeconds
    const recedeEnd = riseDuration + holdDuration + recedeDuration

    if (t < riseDuration) {
      mesh.visible = true
      mesh.position.y = THREE.MathUtils.lerp(hiddenLevel, floodLevel, THREE.MathUtils.smoothstep(t, 0, riseDuration))
    } else if (t < riseDuration + holdDuration) {
      mesh.visible = true
      mesh.position.y = floodLevel
    } else if (t < recedeEnd) {
      mesh.visible = true
      mesh.position.y = THREE.MathUtils.lerp(
        floodLevel,
        hiddenLevel,
        THREE.MathUtils.smoothstep(t, riseDuration + holdDuration, recedeEnd)
      )
    } else {
      mesh.visible = false
    }
  })

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} position={[0, phase1FloodConfig.hiddenLevel, 0]} visible={false}>
      <planeGeometry args={[phase1FloodConfig.size, phase1FloodConfig.size]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
