/**
 * Renderer registry mapping `EditableEntity.type` to the component that paints it.
 * This is the single place that knows how to turn a JSON entity into a mesh/model —
 * `PhaseEngine` just looks types up here, so adding a new scene element never requires
 * touching `PhaseEngine` itself, only registering it below (and, for the editor's
 * "add element" palette, `engine/config/entityCatalog`).
 * @module engine/entityRegistry
 */

import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { BaharequeHouse } from '@/features/phase1/components/parts/BaharequeHouse'
import { SepiaPhotoFrame } from '@/features/phase1/components/parts/SepiaPhotoFrame'
import { ProceduralPortal, ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { CyberWall } from '@/features/library/components/CyberWall'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { Pedestal } from '@/features/pedestal/components/Pedestal'
import { LevitatingBook } from '@/features/pedestal/components/LevitatingBook'
import { cityIntroRenderers } from '@/features/cityIntro/renderers'
import type { EntityRenderer, EntityRendererProps } from '@/engine/types'

export type { EntityRenderer, EntityRendererProps } from '@/engine/types'

function BahareqHouseRenderer({ entity }: EntityRendererProps) {
  const variant = (entity.variant as 'short' | 'medium' | 'long') ?? 'medium'
  const key = `phase1/bahareque-house-${variant}` as keyof typeof modelRegistry
  const path = modelRegistry[key]?.path ?? modelRegistry['phase1/bahareque-house'].path
  return <ModelLoader src={path} fallback={<BaharequeHouse position={[0, 0, 0]} rotationY={0} variant={variant} scale={1} />} />
}

function SepiaPhotoRenderer({ entity, context }: EntityRendererProps) {
  return (
    <ModelLoader
      src={modelRegistry['phase1/sepia-photo'].path}
      fallback={
        <SepiaPhotoFrame
          position={[0, 0, 0]}
          rotationY={0}
          imageIndex={0}
          imageSrc={entity.imageSrc}
          highlighted={context?.highlightedPhotoId === entity.id}
        />
      }
    />
  )
}

function PortalRenderer({ entity }: EntityRendererProps) {
  return <ProceduralPortal position={[0, 0, 0]} radius={1.55} accentColor={entity.variant} />
}

function CyberWallRenderer({ entity }: EntityRendererProps) {
  const variant = entity.variant ?? '22x5.2'
  const size: [number, number, number] = variant === '22x5.2' ? [22, 5.2, 0.45] : [22, 5.2, 0.45]
  return <CyberWall position={[0, 0, 0]} size={size} />
}

function BookshelfRenderer({ entity }: EntityRendererProps) {
  const width = entity.variant ? parseFloat(entity.variant) : 5.2
  return <Bookshelf position={[0, 0, 0]} width={width} />
}

function PedestalRenderer() {
  return <Pedestal />
}

function BookRenderer({ context }: EntityRendererProps) {
  return <LevitatingBook ritualProgress={context?.ritualProgress} />
}

function FacadeRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#e85a3a'
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[3.2, 2.2, 1.9]} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  )
}

function TempleRenderer() {
  return (
    <mesh castShadow>
      <boxGeometry args={[4.2, 3.3, 2.0]} />
      <meshStandardMaterial color="#1a1a1e" roughness={0.98} />
    </mesh>
  )
}

function TrinitariaRenderer({ entity }: EntityRendererProps) {
  const bloom = entity.variant ?? '#d82a7a'
  return <ProceduralTrinitaria position={[0, 0, 0]} bloomColor={bloom} />
}

/** Rendered for a `type` with no registry entry, so missing types stay visible instead of silently vanishing. */
function UnknownEntityRenderer({ entity }: EntityRendererProps) {
  console.warn(`[PhaseEngine] Unknown entity type "${entity.type}" (id "${entity.id}") — check entityRegistry.tsx`)
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#ff3b1f" />
    </mesh>
  )
}

/**
 * Registry of entity renderers keyed by `EditableEntity.type`.
 * To add a new scene element: write its renderer above, register it here, and (optionally)
 * add a matching entry to `engine/config/entityCatalog` so the editor can spawn it.
 */
export const entityRegistry: Record<string, EntityRenderer> = {
  'bahareque-house': BahareqHouseRenderer,
  'sepia-photo': SepiaPhotoRenderer,
  portal: PortalRenderer,
  'cyber-wall': CyberWallRenderer,
  bookshelf: BookshelfRenderer,
  pedestal: PedestalRenderer,
  book: BookRenderer,
  facade: FacadeRenderer,
  temple: TempleRenderer,
  trinitaria: TrinitariaRenderer,
  ...cityIntroRenderers,
}

/**
 * Looks up the renderer for an entity type, falling back to a visible warning box.
 * @param type - `EditableEntity.type` value
 * @returns Renderer component
 */
export function getEntityRenderer(type: string): EntityRenderer {
  return entityRegistry[type] ?? UnknownEntityRenderer
}
