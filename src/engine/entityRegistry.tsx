/**
 * Renderer registry mapping `EditableEntity.type` to the component that paints it.
 * This is the single place that knows how to turn a JSON entity into a mesh/model —
 * `PhaseEngine` just looks types up here, so adding a new scene element never requires
 * touching `PhaseEngine` itself, only registering it below (and, for the editor's
 * "add element" palette, `engine/config/entityCatalog`).
 * @module engine/entityRegistry
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { BaharequeHouse } from '@/features/phase1/components/parts/BaharequeHouse'
import { SepiaPhotoFrame } from '@/features/phase1/components/parts/SepiaPhotoFrame'
import { TrenAnimado } from '@/features/phase1/components/parts/TrenAnimado'
import { PuertoBoat } from '@/features/phase1/components/parts/PuertoBoat'
import { ProceduralPortal, ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { GothicTemple } from '@/features/phase2/components/parts/GothicTemple'
import { MusicalJukebox } from '@/features/phase2/components/parts/MusicalJukebox'
import { ReyMomoPerformer } from '@/features/phase2/components/parts/ReyMomoPerformer'
import { DancerPerformer } from '@/features/phase2/components/parts/DancerPerformer'
import { CarrozaRiwiRenderer } from '@/features/phase2/components/parts/CarrozaRiwiRenderer'
import { useParadeLoopMotion } from '@/features/phase2/renderers/paradeLoop'
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

function ReyMomoRenderer() {
  return (
    <ReyMomoPerformer
      src={modelRegistry['phase2/rey-momo'].path}
      fallback={
        <mesh position={[0, 1.1, 0]} castShadow>
          <capsuleGeometry args={[0.35, 1.2, 4, 8]} />
          <meshStandardMaterial color="#e8dfc8" roughness={0.85} />
        </mesh>
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
 * Generic model renderer — resolves any `phase1/...`/`phase2/...` model key
 * stored in `entity.variant` or directly in `entity.type`. Allows the editor
 * to spawn new `public/models/phase1/**`/`public/models/phase2/**` assets
 * without adding a dedicated renderer per file, keeping the JSON-driven
 * workflow.
 *
 * `phase1/**` assets (rail kit, port scenes, decorators) are authored in
 * consistent real-world meters — the rail modules' 8m length, the train's
 * 0.36m wheel-rest height and the port buildings' tens-of-meters footprints
 * were all co-designed to that same scale — so they render at native size
 * (`entity.scale` only, no normalization). `phase2/**` assets don't share
 * that guarantee (each `.glb` was authored at its own unrelated scale), so
 * they keep the `targetSize` bucket picked from the key's folder.
 * @param props - Entity props
 * @returns Model loader or fallback box
 */
function GenericModelRenderer({ entity }: EntityRendererProps) {
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
  if (normalizedKey.startsWith('phase1/')) {
    return <ModelLoader src={entry.path} fallback={<FallbackForModel normalizedKey={normalizedKey} />} />
  }
  const isFloor = normalizedKey.includes('/floors/')
  const isDecoration = normalizedKey.includes('/decorations/')
  const isScene = normalizedKey.includes('/scenes/')
  const targetSize = isFloor ? 4 : isDecoration ? 1.6 : isScene ? 22 : 6
  return <ModelLoader src={entry.path} targetSize={targetSize} fallback={<FallbackForModel normalizedKey={normalizedKey} />} />
}

/** Registry key of the animated train `.glb` an `entity.variant` should resolve to, when it names a train key directly. */
const TRAIN_KEYS = new Set<string>([
  'phase1/vehicles/tren-completo',
  'phase1/vehicles/tren-locomotora',
  'phase1/vehicles/tren-coche',
  'phase1/vehicles/tren-vagon',
])

/**
 * `[x, z]` waypoints of the rail loop laid out around Estación Montoya in
 * `phase1.json` (the `rail-*` entities) — corners plus one midpoint per side,
 * so the closed Catmull-Rom curve tracks that rectangle closely. The train
 * entity itself sits at the identity transform (`position: [0,0,0]`) since
 * this curve already carries it in world space. Kept 10 units west of the
 * rail JSON's original placement so the loop's east side clears the Río
 * Magdalena's town-side bank (`MAGDALENA_TOWN_EDGE_X`), which used to swallow
 * the track and train on that side.
 */
const TRAIN_LOOP_POINTS: Array<[number, number]> = [
  [-14, -76],
  [18, -76],
  [50, -76],
  [50, -60],
  [50, -44],
  [18, -44],
  [-14, -44],
  [-14, -60],
]

/**
 * Arc-length distance each car trails behind the locomotive, matching the
 * coupler-to-coupler gaps baked into `tren_animado.py` (front coupler +
 * ~0.4m slack + the next car's front-to-center distance). Used to run the
 * consist as independently-oriented pieces instead of one long rigid body
 * pivoting around a single curve sample — which is what made turns at the
 * rail loop's corners look wrong.
 */
const TRAIN_CAR_OFFSETS = [
  { key: 'phase1/vehicles/tren-locomotora', trailDistance: 0 },
  { key: 'phase1/vehicles/tren-coche', trailDistance: 15.5 },
  { key: 'phase1/vehicles/tren-vagon', trailDistance: 25.6 },
] as const

/**
 * The train — its `.glb`s carry baked wheel-rotation clips (see
 * `TrenAnimado`), so it gets its own renderer instead of the generic
 * `ModelLoader`-based one. Runs around {@link TRAIN_LOOP_POINTS} at constant
 * speed regardless of its own JSON `position`/`rotationY`.
 *
 * The default "full train" variant is assembled from the three separately
 * exported car `.glb`s (locomotive, coche, vagón), each independently
 * positioned/oriented along the loop via its own {@link TRAIN_CAR_OFFSETS}
 * trail distance — rather than the single `tren-completo.glb` moved as one
 * rigid body — so each car's heading follows the curve at its own point
 * instead of the whole consist swinging around one pivot on turns.
 * @param props - Entity props
 * @returns Animated train or fallback
 */
function TrenRenderer({ entity }: EntityRendererProps) {
  const loopCurve = useMemo(
    () => new THREE.CatmullRomCurve3(TRAIN_LOOP_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'catmullrom', 0.3),
    []
  )
  const fallback = (
    <group position={[0, 0.55, 0]}>
      <mesh position={[-1.6, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.05, 1]} />
        <meshStandardMaterial color="#2a2118" roughness={0.85} />
      </mesh>
      <mesh position={[-2.6, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 1.3, 12]} />
        <meshStandardMaterial color="#1a1410" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.95, 0.95]} />
        <meshStandardMaterial color="#6a5240" roughness={0.85} />
      </mesh>
    </group>
  )

  if (entity.variant && TRAIN_KEYS.has(entity.variant) && entity.variant !== 'phase1/vehicles/tren-completo') {
    const entry = modelRegistry[entity.variant as keyof typeof modelRegistry]
    return <TrenAnimado src={entry.path} loopCurve={loopCurve} speed={9} fallback={fallback} />
  }

  return (
    <>
      {TRAIN_CAR_OFFSETS.map(({ key, trailDistance }) => (
        <TrenAnimado
          key={key}
          src={modelRegistry[key as keyof typeof modelRegistry].path}
          loopCurve={loopCurve}
          speed={9}
          trailDistance={trailDistance}
          fallback={trailDistance === 0 ? fallback : <></>}
        />
      ))}
    </>
  )
}

/** Boat registry keys that patrol the Río Magdalena instead of staying moored, and their lane offset/speed. */
const PATROL_BOATS: Record<string, { offset: number; speed: number }> = {
  'phase1/decorators/decorativos-vapor-fluvial': { offset: 3, speed: 3.2 },
}

/**
 * Port/river boats — canoe, chalupa and the steamboat all bob gently in
 * place; the steamboat additionally patrols the river (see `PuertoBoat`).
 * @param props - Entity props
 * @returns Bobbing boat or fallback
 */
function PuertoBoatRenderer({ entity }: EntityRendererProps) {
  const key = (entity.variant || entity.type) as keyof typeof modelRegistry
  const entry = modelRegistry[key]
  const seed = createSeededRandom(hashSeed(entity.id))()
  return (
    <PuertoBoat
      src={entry.path}
      seed={seed}
      patrol={PATROL_BOATS[key as string]}
      fallback={
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.5, 0.9]} />
          <meshStandardMaterial color="#5a3d24" roughness={0.85} />
        </mesh>
      }
    />
  )
}

/**
 * "El Poderoso" jukebox — the generic model wrapped with beat vibration and floating notes.
 * @param props - Entity props
 * @returns Animated jukebox
 */
function ElPoderosoRenderer(props: EntityRendererProps) {
  return (
    <MusicalJukebox>
      <GenericModelRenderer {...props} />
    </MusicalJukebox>
  )
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

/**
 * Procedural/model fallback shared by every `parade-vehicle` variant.
 * @returns Fallback vehicle group
 */
function ParadeVehicleFallback() {
  return (
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
  )
}

/**
 * Drives `chiva-rumbera`/`carrosa-marimonda` around the shared parade loop
 * (`useParadeLoopMotion`) — the `carrosa-riwi` variant gets its own renderer
 * ({@link CarrozaRiwiRenderer}) for its video screen and dance sway, so isn't
 * routed here (see `getEntityRenderer`'s `parade-vehicle` case below).
 * @param props - Entity props
 * @returns Loop-driving vehicle
 */
function ParadeVehicleRenderer({ entity }: EntityRendererProps) {
  const key = VEHICLE_MODELS[entity.variant ?? ''] ?? VEHICLE_MODELS['chiva-rumbera']
  const loopRef = useRef<THREE.Group>(null)
  useParadeLoopMotion(loopRef, entity.id, entity.variant)
  return (
    <group ref={loopRef}>
      <ModelLoader src={modelRegistry[key].path} fallback={<ParadeVehicleFallback />} />
    </group>
  )
}

/**
 * `parade-vehicle` dispatcher — `carrosa-riwi` gets its own renderer (video
 * screen + dance sway), every other variant gets the plain loop-driving one.
 * @param props - Entity props
 * @returns The variant-appropriate vehicle renderer
 */
function ParadeVehicleDispatcher({ entity }: EntityRendererProps) {
  if (entity.variant === 'carrosa-riwi') {
    return <CarrozaRiwiRenderer entity={entity} fallback={<ParadeVehicleFallback />} />
  }
  return <ParadeVehicleRenderer entity={entity} />
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
  'rey-momo': ReyMomoRenderer,
  'parade-vehicle': ParadeVehicleDispatcher,
  'phase2/decorations/el-poderoso': ElPoderosoRenderer,
  'phase2-house': GenericModelRenderer,
  'phase2-floor': GenericModelRenderer,
  'phase2-decoration': GenericModelRenderer,
  'phase2-scene': GenericModelRenderer,
  'phase2-model': GenericModelRenderer,
  'phase1-train': TrenRenderer,
  'phase1/decorators/decorativos-bote-canoa': PuertoBoatRenderer,
  'phase1/decorators/decorativos-bote-chalupa': PuertoBoatRenderer,
  'phase1/decorators/decorativos-vapor-fluvial': PuertoBoatRenderer,
  'phase1-floor': GenericModelRenderer,
  'phase1-decoration': GenericModelRenderer,
  'phase1-scene': GenericModelRenderer,
  'phase1-vehicle': GenericModelRenderer,
  'phase1-model': GenericModelRenderer,
  ...cityIntroRenderers,
}

/**
 * Looks up the renderer for an entity type. If the type itself is a
 * `modelRegistry` key (e.g. `phase1/floors/rieles-riel-recta`,
 * `phase2/houses/casa-cafe`), a generic model renderer is returned so new
 * `public/models/phase1/**`/`public/models/phase2/**` files work without
 * manual registry edits.
 * @param type - `EditableEntity.type` value
 * @returns Renderer component
 */
export function getEntityRenderer(type: string): EntityRenderer {
  if (entityRegistry[type]) return entityRegistry[type]
  if ((modelRegistry as Record<string, unknown>)[type]) return GenericModelRenderer
  return UnknownEntityRenderer
}
