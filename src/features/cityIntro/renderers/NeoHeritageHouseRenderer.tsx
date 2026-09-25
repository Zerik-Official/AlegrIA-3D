/**
 * `neo-heritage-house` — la casa de Barrio Abajo en 2050. Reemplaza a los
 * rascacielos oscuros abstractos: un solo piso, fachada saturada, y toda la
 * carpintería republicana (zócalo, molduras, marcos de puerta y ventana,
 * cornisa) convertida en tira de energía solar integrada que emite luz.
 *
 * La silueta (ancho, fondo, si tiene alero o antepecho) sale de una semilla
 * determinista del `id`, así que la calle no se ve repetida pero cada casa se
 * ve igual en cada carga. `variant` fija el color de fachada y `title` el
 * neón de las molduras; ambos opcionales.
 * @module features/cityIntro/renderers/NeoHeritageHouseRenderer
 */

import { useMemo } from 'react'
import { createSeededRandom, hashSeed } from '@/shared/utils/random'
import { FACADE_PALETTE, TEJA_BARRO, TRIM_PALETTE } from '@/features/cityIntro/config/colorPalette'
import type { EntityRendererProps } from '@/engine/types'

/** Altura del piso único; el barrio se mantiene bajo y horizontal a propósito. */
const WALL_H = 3.6
/** Alto del zócalo pintado que recorre la base de la fachada. */
const PLINTH_H = 0.85

/**
 * @param props - Entity props
 * @returns Casa neopatrimonial con molduras emisivas
 */
export function NeoHeritageHouseRenderer({ entity }: EntityRendererProps) {
  const shape = useMemo(() => {
    const rand = createSeededRandom(hashSeed(entity.id))
    const pick = Math.floor(rand() * FACADE_PALETTE.length)
    return {
      width: 6.4 + rand() * 3.4,
      depth: 5.2 + rand() * 2.6,
      windows: rand() > 0.45 ? 3 : 2,
      hasEave: rand() > 0.35,
      facadeFallback: FACADE_PALETTE[pick],
      trimFallback: TRIM_PALETTE[Math.floor(rand() * TRIM_PALETTE.length)],
    }
  }, [entity.id])

  const facade = entity.variant ?? shape.facadeFallback
  const trim = entity.title?.startsWith('#') ? entity.title : shape.trimFallback
  const { width, depth, windows, hasEave } = shape
  const front = depth / 2

  /** Repartidos sobre el ancho dejando el centro libre para la puerta. */
  const windowXs = Array.from({ length: windows }, (_, i) => {
    const span = width - 2.2
    return windows === 1 ? 0 : -span / 2 + (i * span) / (windows - 1)
  }).filter((x) => Math.abs(x) > 0.8)

  return (
    <group>
      <mesh position={[0, WALL_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, WALL_H, depth]} />
        <meshStandardMaterial color={facade} roughness={0.82} metalness={0.05} />
      </mesh>

      <mesh position={[0, PLINTH_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.12, PLINTH_H, depth + 0.12]} />
        <meshStandardMaterial color="#3a2430" roughness={0.94} />
      </mesh>
      <mesh position={[0, PLINTH_H + 0.04, 0]}>
        <boxGeometry args={[width + 0.2, 0.08, depth + 0.2]} />
        <meshStandardMaterial color="#120a14" emissive={trim} emissiveIntensity={1.6} roughness={0.4} />
      </mesh>

      <mesh position={[0, WALL_H - 0.18, 0]}>
        <boxGeometry args={[width + 0.24, 0.16, depth + 0.24]} />
        <meshStandardMaterial color="#120a14" emissive={trim} emissiveIntensity={1.9} roughness={0.35} />
      </mesh>

      <mesh position={[0, WALL_H + 0.9, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[Math.max(width, depth) * 0.72, 1.8, 4]} />
        <meshStandardMaterial color={TEJA_BARRO} roughness={0.88} />
      </mesh>

      {hasEave && (
        <>
          <mesh position={[0, WALL_H - 0.5, front + 0.75]} castShadow>
            <boxGeometry args={[width * 0.92, 0.12, 1.6]} />
            <meshStandardMaterial color="#4a2f22" roughness={0.9} />
          </mesh>
          <mesh position={[0, WALL_H - 0.58, front + 1.52]}>
            <boxGeometry args={[width * 0.92, 0.06, 0.06]} />
            <meshStandardMaterial color="#120a14" emissive={trim} emissiveIntensity={2.2} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[(s * width * 0.92) / 2, WALL_H * 0.5, front + 1.45]} castShadow>
              <cylinderGeometry args={[0.07, 0.08, WALL_H - 0.6, 8]} />
              <meshStandardMaterial color="#4a2f22" roughness={0.9} />
            </mesh>
          ))}
        </>
      )}

      <mesh position={[0, 1.25, front + 0.03]}>
        <planeGeometry args={[1.5, 2.5]} />
        <meshStandardMaterial color="#1c1018" roughness={0.8} emissive={trim} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 1.25, front + 0.05]}>
        <boxGeometry args={[1.72, 2.72, 0.05]} />
        <meshStandardMaterial color="#120a14" emissive={trim} emissiveIntensity={1.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.25, front + 0.06]}>
        <boxGeometry args={[1.5, 2.5, 0.02]} />
        <meshStandardMaterial color="#0d0710" roughness={0.9} />
      </mesh>

      {windowXs.map((x) => (
        <group key={x} position={[x, 1.85, front + 0.04]}>
          <mesh>
            <boxGeometry args={[1.12, 1.82, 0.05]} />
            <meshStandardMaterial color="#120a14" emissive={trim} emissiveIntensity={1.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.92, 1.6]} />
            <meshStandardMaterial color="#2a1a10" emissive="#FFD08A" emissiveIntensity={0.9} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.05, 1.6, 0.02]} />
            <meshStandardMaterial color="#120a14" emissive={trim} emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
