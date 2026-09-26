/**
 * Three screens drifting over the concert crowd, tilted down at the floor,
 * each showing one partner's logo as a hologram glowing on a black panel.
 * They drift mostly along the street, so none wanders into the buildings.
 * @module features/cityIntro/renderers/concert/PartnerScreens
 */

import { memo, Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PARTNERS } from '@/shared/config/partners'
import { createPartnerHologramMaterial, preparePartnerLogos } from '@/features/cityIntro/renderers/PartnerHologramMaterial'
import { GlowSprite } from '@/shared/components/LightGlows'

/** Screen size. */
const SCREEN_W = 3.4
const SCREEN_H = 1.9
/** How far each screen drifts across the street (kept small so none reaches the buildings) and along it. */
const SWAY_ACROSS = 0.5
const SWAY_ALONG = 1.4
/** How far each screen tips down towards the floor, in radians. */
const TILT = 1.05

/**
 * Props for {@link PartnerScreens}.
 */
interface PartnerScreensProps {
  /** Where each screen hovers, one per partner, in order. */
  positions: Array<[number, number, number]>
}

/**
 * @param props - Hover positions
 * @returns The three screens
 */
function Screens({ positions }: PartnerScreensProps) {
  const logos = useTexture(
    PARTNERS.map((partner) => partner.src),
    preparePartnerLogos
  )
  const materials = useMemo(() => {
    const keep = PARTNERS.map((partner) => (partner.invert ? 0 : 0.85))
    return PARTNERS.map((_, i) => createPartnerHologramMaterial(logos, keep, SCREEN_W / SCREEN_H, 1, { cells: 1, firstCell: i, flipY: true }))
  }, [logos])
  const groupRefs = useRef<Array<THREE.Group | null>>([])
  const screenRefs = useRef<Array<THREE.Mesh | null>>([])

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    positions.forEach(([x, y, z], i) => {
      const group = groupRefs.current[i]
      if (group) {
        const phase = i * 2.1
        group.position.set(x + Math.sin(t * 0.35 + phase) * SWAY_ACROSS, y + Math.sin(t * 0.9 + phase) * 0.35, z + Math.cos(t * 0.28 + phase) * SWAY_ALONG)
        group.rotation.y = Math.sin(t * 0.3 + phase) * 0.35
      }
      const screen = screenRefs.current[i]
      if (screen) (screen.material as THREE.ShaderMaterial).uniforms.uTime.value = t + i * 1.7
    })
  })

  return (
    <>
      {positions.map((position, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el
          }}
          position={position}
        >
          <group rotation-x={TILT}>
            <mesh position={[0, 0, -0.08]}>
              <boxGeometry args={[SCREEN_W + 0.2, SCREEN_H + 0.2, 0.1]} />
              <meshStandardMaterial color="#0b0d15" metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, -0.02]}>
              <planeGeometry args={[SCREEN_W, SCREEN_H]} />
              <meshBasicMaterial color="#020306" toneMapped={false} />
            </mesh>
            <mesh position={[0, -SCREEN_H / 2 - 0.07, 0.01]}>
              <planeGeometry args={[SCREEN_W + 0.1, 0.03]} />
              <meshBasicMaterial color="#49e9ff" toneMapped={false} />
            </mesh>
            <mesh
              ref={(el) => {
                screenRefs.current[i] = el
              }}
              material={materials[i]}
            >
              <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            </mesh>
          </group>
          <GlowSprite color="#49e9ff" size={1.3} opacity={0.5} position={[0, 0.45, 0]} />
        </group>
      ))}
    </>
  )
}

/**
 * @param props - Hover positions
 * @returns The screens, once the logos have loaded
 */
export const PartnerScreens = memo(function PartnerScreens({ positions }: PartnerScreensProps) {
  return (
    <Suspense fallback={null}>
      <Screens positions={positions} />
    </Suspense>
  )
})
