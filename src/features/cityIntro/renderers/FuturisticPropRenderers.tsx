/**
 * Renderers for the futuristic `.glb` set used along the `cityIntro` street:
 * lattice ("mesh") towers, needle towers, neon benches and neon planters.
 * Towers are normalized by height so the entity `scale` reads as a multiplier.
 * @module features/cityIntro/renderers/FuturisticPropRenderers
 */

import { useMemo } from 'react'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { hashSeed } from '@/shared/utils/random'
import { ProceduralSkyscraper } from '@/features/cityIntro/renderers/SkyscraperRenderer'
import type { EntityRendererProps } from '@/engine/types'

/** Height (world units) of the lattice tower at `scale: 1`. */
const MESH_TOWER_HEIGHT = 28
/** Height (world units) of the needle tower at `scale: 1`. */
const NEEDLE_TOWER_HEIGHT = 42

/**
 * @param props - Entity props
 * @returns Lattice-mesh tower
 */
export function MeshTowerRenderer({ entity }: EntityRendererProps) {
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  return <ModelLoader src={modelRegistry['cityIntro/tower-mesh'].path} targetSize={MESH_TOWER_HEIGHT} fallback={<ProceduralSkyscraper seed={seed} />} />
}

/**
 * @param props - Entity props
 * @returns Needle spire tower
 */
export function NeedleTowerRenderer({ entity }: EntityRendererProps) {
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  return <ModelLoader src={modelRegistry['cityIntro/tower-needle'].path} targetSize={NEEDLE_TOWER_HEIGHT} fallback={<ProceduralSkyscraper seed={seed} />} />
}

/**
 * Neon bench, kept at its authored scale (~1.8 wide). Its seat faces model +Z.
 * @returns Bench model
 */
export function NeonBenchRenderer() {
  return (
    <ModelLoader
      src={modelRegistry['cityIntro/bench-neon'].path}
      scale={1.3}
      castShadow={false}
      fallback={
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.8, 0.8, 0.6]} />
          <meshStandardMaterial color="#101820" emissive="#2ab8e0" emissiveIntensity={0.4} />
        </mesh>
      }
    />
  )
}

/**
 * Neon planter, kept at its authored scale (~1.6 wide).
 * @returns Planter model
 */
export function NeonPlanterRenderer() {
  return (
    <ModelLoader
      src={modelRegistry['cityIntro/planter-neon'].path}
      scale={1.3}
      castShadow={false}
      fallback={
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.6, 1, 1]} />
          <meshStandardMaterial color="#101820" emissive="#2ab8e0" emissiveIntensity={0.4} />
        </mesh>
      }
    />
  )
}
