/**
 * The RIWI Barranquilla room the credits scene is staged in, loaded from the
 * Blender-authored `software-factory.glb` (floor, walls, pillars, ceiling,
 * windows, doors and services as separate nodes): the 18 x 12 m main hall,
 * its annex, glass-brick windows, the `</Riwi>` glass door and the exposed
 * ceiling with lamps, trays and the red fire pipe. Jafet dances in the gap
 * between the central and east pillars (`CREDITS_CENTER`).
 * @module features/credits/components/CreditsRoom
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { CREDITS_CENTER } from '@/features/credits/config/creditsConfig'
import { canvasTexture } from '@/features/cityIntro/components/carnival/neonCanvas'

/** Ceiling height of the authored room, for key light placement. */
const ROOM_H = 6.2

/** Warm spotlight pool on the floor where Jafet dances. */
const StageGlow = memo(function StageGlow() {
  const texture = useMemo(
    () =>
      canvasTexture(128, 128, (c, w, h) => {
        const gradient = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
        gradient.addColorStop(0, 'rgba(255,210,140,0.85)')
        gradient.addColorStop(0.55, 'rgba(200,120,255,0.35)')
        gradient.addColorStop(1, 'rgba(168,85,255,0)')
        c.fillStyle = gradient
        c.fillRect(0, 0, w, h)
      }),
    []
  )
  return (
    <mesh rotation-x={-Math.PI / 2} position={[CREDITS_CENTER[0], 0.015, CREDITS_CENTER[2]]}>
      <planeGeometry args={[5.5, 5.5]} />
      <meshBasicMaterial map={texture} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
})

/**
 * Bare floor shown only while the authored room loads, or when its `.glb`
 * is missing.
 * @returns Fallback floor
 */
function RoomFallback() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[18, 12]} />
      <meshStandardMaterial color="#8f8f8f" roughness={0.92} metalness={0.05} />
    </mesh>
  )
}

/**
 * The whole room: authored shell plus the dance-floor glow and lighting.
 * The `.glb` is authored in meters with its origin at the hall's floor
 * center, so it lands 1:1 with no rescaling.
 * @returns Room group
 */
export const CreditsRoom = memo(function CreditsRoom() {
  return (
    <group>
      <ModelLoader src={modelRegistry['credits/buildings/software-factory'].path} fallback={<RoomFallback />} />
      <StageGlow />

      {/* Warm overhead key light, softer than a flat office wash. */}
      <pointLight position={[CREDITS_CENTER[0], ROOM_H - 0.8, CREDITS_CENTER[2]]} intensity={0.9} distance={18} decay={2} color="#fff2dc" />
      <pointLight position={[-4.5, ROOM_H - 0.8, 3]} intensity={0.55} distance={14} decay={2} color="#fff2dc" />
      <pointLight position={[4.5, ROOM_H - 0.8, -3]} intensity={0.55} distance={14} decay={2} color="#fff2dc" />

      {/* Gold/magenta stage accents flanking the dancer, echoing the credits overlay's palette. */}
      <pointLight position={[CREDITS_CENTER[0] - 1.6, 1.6, 1.6]} intensity={1.3} distance={7} decay={2} color="#ffcc33" />
      <pointLight position={[CREDITS_CENTER[0] + 1.6, 1.6, -1.6]} intensity={1.3} distance={7} decay={2} color="#a855ff" />
      <spotLight position={[CREDITS_CENTER[0], ROOM_H - 0.2, CREDITS_CENTER[2]]} intensity={2.4} distance={10} angle={0.55} penumbra={0.7} decay={2} color="#ffd9a0" />
    </group>
  )
})
