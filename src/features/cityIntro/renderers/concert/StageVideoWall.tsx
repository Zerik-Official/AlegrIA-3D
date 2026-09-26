/**
 * The screen on the concert stage's back wall, behind the fox. It stays dark
 * until the mototaxi arrives; then the tour video its dashboard was playing
 * moves here, powering on with a fade and a quick vertical wipe, and keeps
 * looping, muted.
 * @module features/cityIntro/renderers/concert/StageVideoWall
 */

import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVideoPlaylistTexture } from '@/shared/hooks/useVideoPlaylistTexture'
import { mototaxiState } from '@/features/cityIntro/state/mototaxiState'

/** The tour video, the same one the mototaxi's dashboard shows during the ride. */
const WALL_VIDEO = [`${import.meta.env.BASE_URL}videos/future/barrio-abajo-tour.mp4`]
/** Screen size — the video is portrait (720 × 1280). */
const SCREEN_H = 6.2
const SCREEN_W = SCREEN_H * (720 / 1280)
/** Seconds the power-on takes. */
const POWER_ON_S = 1.2

/**
 * Props for {@link StageVideoWall}.
 */
interface StageVideoWallProps {
  /** Center of the screen, on the wall's face. */
  position: [number, number, number]
}

/**
 * @param props - Placement
 * @returns Framed screen
 */
export const StageVideoWall = memo(function StageVideoWall({ position }: StageVideoWallProps) {
  const texture = useVideoPlaylistTexture(WALL_VIDEO)
  const screenRef = useRef<THREE.Mesh>(null)
  const power = useRef(0)

  useFrame((_, delta) => {
    const screen = screenRef.current
    if (!screen) return
    const target = mototaxiState.arrived && texture ? 1 : 0
    power.current = THREE.MathUtils.clamp(power.current + (target > power.current ? 1 : -1) * (delta / POWER_ON_S), 0, 1)
    const eased = power.current * power.current * (3 - 2 * power.current)
    screen.visible = eased > 0.001
    screen.scale.set(1, Math.max(0.02, eased), 1)
    const material = screen.material as THREE.MeshBasicMaterial
    material.opacity = eased
    if (material.map !== texture) {
      material.map = texture
      material.needsUpdate = true
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[SCREEN_W + 0.35, SCREEN_H + 0.35, 0.1]} />
        <meshStandardMaterial color="#07080d" metalness={0.6} roughness={0.4} emissive="#a855ff" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={screenRef} visible={false}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  )
})
