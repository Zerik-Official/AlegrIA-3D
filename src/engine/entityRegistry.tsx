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
import { GothicTemple } from '@/features/phase2/components/parts/GothicTemple'
import { DancerPerformer } from '@/features/phase2/components/parts/DancerPerformer'
import { CyberWall } from '@/features/library/components/CyberWall'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { Pedestal } from '@/features/pedestal/components/Pedestal'
import { LevitatingBook } from '@/features/pedestal/components/LevitatingBook'
import { cityIntroRenderers } from '@/features/cityIntro/renderers'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import type { EntityRenderer, EntityRendererProps } from '@/engine/types'

export type { EntityRenderer, EntityRendererProps } from '@/engine/types'

function BahareqHouseRenderer({ entity }: EntityRendererProps) {
  const variant = (entity.variant as 'short' | 'medium' | 'long') ?? 'medium'
  const key = `phase1/bahareque-house-${variant}` as keyof typeof modelRegistry
  const path = modelRegistry[key]?.path ?? modelRegistry['phase1/bahareque-house'].path
  return <ModelLoader src={path} fallback={<BaharequeHouse position={[0, 0, 0]} rotationY={0} variant={variant} scale={1} />} />
}

/**
 * Resolves the image source for a sepia-photo entity, falling back to
 * `sepiaPhotos` when the JSON-driven `imageSrc` is missing (e.g. after a
 * manual `phase1.json` edit that omits the field).
 * @param entity - Entity being rendered
 * @returns Resolved image URL or undefined
 */
function resolveSepiaImageSrc(entity: EntityRendererProps['entity']): string | undefined {
  if (entity.imageSrc) return entity.imageSrc
  const photo = sepiaPhotos.find((p) => p.id === entity.id)
  return photo?.src
}

function SepiaPhotoRenderer({ entity, context }: EntityRendererProps) {
  const imageSrc = resolveSepiaImageSrc(entity)
  return (
    <ModelLoader
      src={modelRegistry['phase1/sepia-photo'].path}
      fallback={
        <SepiaPhotoFrame
          position={[0, 0, 0]}
          rotationY={0}
          imageIndex={0}
          imageSrc={imageSrc}
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

/**
 * The source `.glb` is authored ~220 units wide (real-world scale mismatch,
 * not a design choice) — `targetSize` normalizes its footprint down to a
 * corner-plot-sized building, and the extra Y-only `scale` compensates for
 * how flat that leaves it so it still reads as a building rather than a slab.
 */
function ParroquiaRenderer() {
  return (
    <ModelLoader src={modelRegistry['phase2/parroquia'].path} targetSize={16} scale={[1, 2.3, 1]} fallback={<GothicTemple position={[0, 0, 0]} />} />
  )
}

function CarnivalHouseRenderer() {
  return (
    <ModelLoader
      src={modelRegistry['phase2/casa-carnavalera'].path}
      targetSize={8}
      fallback={
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 3, 6]} />
          <meshStandardMaterial color="#e8542a" roughness={0.85} />
        </mesh>
      }
    />
  )
}

function TrinitariaRenderer({ entity }: EntityRendererProps) {
  const bloom = entity.variant ?? '#d82a7a'
  return <ProceduralTrinitaria position={[0, 0, 0]} bloomColor={bloom} />
}

/** `dancer` entity variant → registry key + a fallback dress/shirt color. */
const DANCER_MODELS: Record<string, { key: keyof typeof modelRegistry; color: string }> = {
  'bailarina-amarilla': { key: 'phase2/bailarina-amarilla', color: '#e8c23a' },
  'bailarina-azul': { key: 'phase2/bailarina-azul', color: '#2a4ad8' },
  'bailarina-roja': { key: 'phase2/bailarina-roja', color: '#d82a2a' },
  'bailarina-verde': { key: 'phase2/bailarina-verde', color: '#2a9a4a' },
  'bailarin-blanco': { key: 'phase2/bailarin-blanco', color: '#e8dfc8' },
  'bailarin-blanco-azul': { key: 'phase2/bailarin-blanco-azul', color: '#3a5ad8' },
}

function DancerRenderer({ entity }: EntityRendererProps) {
  const dancer = DANCER_MODELS[entity.variant ?? ''] ?? DANCER_MODELS['bailarina-amarilla']
  const seed = createSeededRandom(hashSeed(entity.id))()
  return (
    <DancerPerformer
      src={modelRegistry[dancer.key].path}
      seed={seed}
      fallback={
        <group>
          <mesh position={[0, 0.85, 0]} castShadow>
            <capsuleGeometry args={[0.3, 0.85, 4, 8]} />
            <meshStandardMaterial color={dancer.color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.5, 0]} castShadow>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshStandardMaterial color="#4a3320" roughness={0.9} />
          </mesh>
        </group>
      }
    />
  )
}

/** `parade-vehicle` entity variant → registry key. */
const VEHICLE_MODELS: Record<string, keyof typeof modelRegistry> = {
  'carrosa-riwi': 'phase2/carrosa-riwi',
  'carrosa-marimonda': 'phase2/carrosa-marimonda',
  'chiva-rumbera': 'phase2/chiva-rumbera',
}

/**
 * Generic phase2 model renderer — resolves any `phase2/...` model key stored
 * in `entity.variant` or directly in `entity.type`. Allows the editor to
 * spawn new `public/models/phase2/**` assets without adding a dedicated
 * renderer per file, keeping the JSON-driven workflow.
 * @param props - Entity props
 * @returns Model loader or fallback box
 */
function GenericPhase2ModelRenderer({ entity }: EntityRendererProps) {
  const rawKey = (entity.variant || entity.type) as string
  const normalizedKey = rawKey as keyof typeof modelRegistry
  const entry = modelRegistry[normalizedKey]
  if (!entry) {
    return (
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#8a3a2a" />
      </mesh>
    )
  }
  const isFloor = normalizedKey.includes('/floors/')
  const isDecoration = normalizedKey.includes('/decorations/')
  const isScene = normalizedKey.includes('/scenes/')
  const targetSize = isFloor ? 4 : isDecoration ? 1.6 : isScene ? 22 : 6
  return <ModelLoader src={entry.path} targetSize={targetSize} fallback={<FallbackForModel normalizedKey={normalizedKey} />} />
}

/**
 * Procedural fallback for the generic phase2 renderer.
 * @param props - Key hint to pick a plausible primitive
 * @returns Placeholder mesh
 */
function FallbackForModel({ normalizedKey }: { normalizedKey: string }) {
  if (normalizedKey.includes('/floors/')) {
    return (
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#cfc3a0" roughness={1} />
      </mesh>
    )
  }
  if (normalizedKey.includes('/decorations/')) {
    return (
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#d9b06a" roughness={0.8} />
      </mesh>
    )
  }
  if (normalizedKey.includes('/houses/')) {
    return (
      <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[2.2, 1.6, 2.2]} />
        <meshStandardMaterial color="#e8a040" roughness={0.9} />
      </mesh>
    )
  }
  return (
    <mesh castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#c9a87a" wireframe />
    </mesh>
  )
}

function ParadeVehicleRenderer({ entity }: EntityRendererProps) {
  const key = VEHICLE_MODELS[entity.variant ?? ''] ?? VEHICLE_MODELS['chiva-rumbera']
  return (
    <ModelLoader
      src={modelRegistry[key].path}
      fallback={
        <group>
          <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.6, 1.4, 1.7]} />
            <meshStandardMaterial color="#d8542a" roughness={0.7} />
          </mesh>
          {([[-1.3, 0.9], [1.3, 0.9], [-1.3, -0.9], [1.3, -0.9]] as const).map(([x, z]) => (
            <mesh key={`${x}-${z}`} position={[x, 0.32, z]} rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.26, 14]} />
              <meshStandardMaterial color="#1a1208" roughness={0.9} />
            </mesh>
          ))}
        </group>
      }
    />
  )
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
  parroquia: ParroquiaRenderer,
  'carnival-house': CarnivalHouseRenderer,
  trinitaria: TrinitariaRenderer,
  dancer: DancerRenderer,
  'parade-vehicle': ParadeVehicleRenderer,
  'phase2-house': GenericPhase2ModelRenderer,
  'phase2-floor': GenericPhase2ModelRenderer,
  'phase2-decoration': GenericPhase2ModelRenderer,
  'phase2-scene': GenericPhase2ModelRenderer,
  'phase2-model': GenericPhase2ModelRenderer,
  ...cityIntroRenderers,
}

/**
 * Looks up the renderer for an entity type. If the type itself is a
 * `modelRegistry` key (e.g. `phase2/houses/casa-cafe`), a generic model
 * renderer is returned so new `public/models/phase2/**` files work
 * without manual registry edits.
 * @param type - `EditableEntity.type` value
 * @returns Renderer component
 */
export function getEntityRenderer(type: string): EntityRenderer {
  if (entityRegistry[type]) return entityRegistry[type]
  if ((modelRegistry as Record<string, unknown>)[type]) return GenericPhase2ModelRenderer
  return UnknownEntityRenderer
}
