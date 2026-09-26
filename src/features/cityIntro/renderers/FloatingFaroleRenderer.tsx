/**
 * `floating-farol` — los faroles de La Guacherna, levitando. Sustituyen a las
 * farolas metálicas de poste como fuente de luz de la calle: la iluminación
 * del barrio en 2050 la sigue dando el desfile, solo que el farol ya no lo
 * carga nadie.
 *
 * Cada farol flota con su propio desfase (semilla del `id`) para que el grupo
 * respire desacompasado en vez de moverse en bloque. `variant` fija el color
 * del papel y de la luz.
 * @module features/cityIntro/renderers/FloatingFaroleRenderer
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createSeededRandom, hashSeed } from '@/shared/utils/random'
import { GUACHERNA_FIRE } from '@/features/cityIntro/config/colorPalette'
import type { EntityRendererProps } from '@/engine/types'
import { GlowSprite, GroundGlow } from '@/shared/components/LightGlows'

/** Altura base de vuelo sobre el punto de la entidad. */
const HOVER_Y = 3.4
/** Amplitud (unidades) del vaivén vertical. */
const BOB_AMPLITUDE = 0.32

/**
 * @param props - Entity props (`variant` = color del farol)
 * @returns Farol flotante animado con su luz
 */
export function FloatingFaroleRenderer({ entity }: EntityRendererProps) {
  const groupRef = useRef<THREE.Group>(null)
  const color = entity.variant ?? GUACHERNA_FIRE

  const motion = useMemo(() => {
    const rand = createSeededRandom(hashSeed(entity.id))
    return { phase: rand() * Math.PI * 2, speed: 0.55 + rand() * 0.5, spin: 0.12 + rand() * 0.18 }
  }, [entity.id])

  useFrame(({ clock }) => {
    const g = groupRef.current
    if (!g) return
    const t = clock.elapsedTime
    g.position.y = HOVER_Y + Math.sin(t * motion.speed + motion.phase) * BOB_AMPLITUDE
    g.rotation.y = t * motion.spin
    g.rotation.z = Math.sin(t * motion.speed * 0.7 + motion.phase) * 0.07
  })

  return (
    <>
      <GroundGlow color={color} radius={2.6} opacity={0.4} />
      <group ref={groupRef} position={[0, HOVER_Y, 0]}>
        <mesh>
          <cylinderGeometry args={[0.42, 0.34, 0.72, 8, 1, true]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.6}
            roughness={0.85}
            side={THREE.DoubleSide}
            transparent
            opacity={0.92}
          />
        </mesh>

        {[0.4, -0.4].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[y > 0 ? 0.44 : 0.36, y > 0 ? 0.44 : 0.36, 0.07, 8]} />
            <meshStandardMaterial color="#5a3a22" roughness={0.9} />
          </mesh>
        ))}

        <mesh>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshBasicMaterial color="#FFF3D0" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.74, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <GlowSprite color={color} size={2.6} opacity={0.4} />

        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos((i / 4) * Math.PI * 2) * 0.26, -0.62, Math.sin((i / 4) * Math.PI * 2) * 0.26]}>
            <boxGeometry args={[0.05, 0.36, 0.05]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.9} />
          </mesh>
        ))}
      </group>
    </>
  )
}
