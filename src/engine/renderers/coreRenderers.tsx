/**
 * Renderers for the engine's built-in entity types (library, phase 1,
 * phase 2 and the shared collider/generic-model fallbacks), registered by
 * type in `engine/entityRegistry`.
 * @module engine/renderers/coreRenderers
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { BaharequeHouse } from '@/features/phase1/components/parts/BaharequeHouse'
import { SepiaPhotoFrame } from '@/features/phase1/components/parts/SepiaPhotoFrame'
import { TrenAnimado } from '@/features/phase1/components/parts/TrenAnimado'
import { RailTunnel } from '@/features/phase1/components/parts/RailTunnel'
import { PuertoBoat } from '@/features/phase1/components/parts/PuertoBoat'
import { ProceduralPortal, ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { GothicTemple } from '@/features/phase2/components/parts/GothicTemple'
import { MusicalJukebox } from '@/features/phase2/components/parts/MusicalJukebox'
import { ReyMomoPerformer } from '@/features/phase2/components/parts/ReyMomoPerformer'
import { CongasPerformer } from '@/features/phase2/components/parts/CongasPerformer'
import { DancerPerformer } from '@/features/phase2/components/parts/DancerPerformer'
import { CarrozaRiwiRenderer } from '@/features/phase2/components/parts/CarrozaRiwiRenderer'
import { useParadeLoopMotion } from '@/features/phase2/renderers/paradeLoop'
import { CyberWall } from '@/features/library/components/CyberWall'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { Pedestal } from '@/features/pedestal/components/Pedestal'
import { LevitatingBook } from '@/features/pedestal/components/LevitatingBook'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import type { EntityRendererProps } from '@/engine/types'

export function BahareqHouseRenderer({ entity }: EntityRendererProps) {
  const variant = (entity.variant as 'short' | 'medium' | 'long') ?? 'medium'
  const key = `phase1/bahareque-house-${variant}` as keyof typeof modelRegistry
  const path = modelRegistry[key]?.path ?? modelRegistry['phase1/bahareque-house'].path
  return (
    <ModelLoader
      src={path}
      collisionId={entity.id}
      collisionFallback="bounds"
      fallback={<BaharequeHouse position={[0, 0, 0]} rotationY={0} variant={variant} scale={1} />}
    />
  )
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

export function SepiaPhotoRenderer({ entity, context }: EntityRendererProps) {
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

export function PortalRenderer({ entity }: EntityRendererProps) {
  return <ProceduralPortal position={[0, 0, 0]} radius={1.55} accentColor={entity.variant} />
}

export function CyberWallRenderer({ entity }: EntityRendererProps) {
  const variant = entity.variant ?? '22x5.2'
  const size: [number, number, number] = variant === '22x5.2' ? [22, 5.2, 0.45] : [22, 5.2, 0.45]
  return <CyberWall position={[0, 0, 0]} size={size} />
}

export function BookshelfRenderer({ entity }: EntityRendererProps) {
  const width = entity.variant ? parseFloat(entity.variant) : 5.2
  return <Bookshelf position={[0, 0, 0]} width={width} />
}

export function PedestalRenderer() {
  return <Pedestal />
}

export function BookRenderer({ context }: EntityRendererProps) {
  return <LevitatingBook ritualProgress={context?.ritualProgress} />
}

export function FacadeRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#e85a3a'
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[3.2, 2.2, 1.9]} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  )
}

export function TempleRenderer() {
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
export function ParroquiaRenderer() {
  return (
    <ModelLoader src={modelRegistry['phase2/parroquia'].path} targetSize={16} scale={[1, 2.3, 1]} fallback={<GothicTemple position={[0, 0, 0]} />} />
  )
}

export function CarnivalHouseRenderer() {
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

export function TrinitariaRenderer({ entity }: EntityRendererProps) {
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

export function DancerRenderer({ entity }: EntityRendererProps) {
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

export function ReyMomoRenderer() {
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

/**
 * The congas player parked by a fritos stand, watching the plaza dance —
 * its `.glb` carries a baked conga-drumming loop clip (see `CongasPerformer`),
 * so it gets its own renderer instead of the generic `ModelLoader`-based one.
 * @returns Animated congas character or fallback
 */
export function CongasRenderer() {
  return (
    <CongasPerformer
      src={modelRegistry['phase2/congas-personaje'].path}
      fallback={
        <group>
          <mesh position={[0, 0.85, 0]} castShadow>
            <capsuleGeometry args={[0.3, 0.85, 4, 8]} />
            <meshStandardMaterial color="#8a5a2a" roughness={0.85} />
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
 * Generic model renderer — resolves any `phase1/...`/`phase2/...` model key
 * stored in `entity.variant` or directly in `entity.type`. Allows the editor
 * to spawn new `public/models/phase1/**`/`public/models/phase2/**` assets
 * without adding a dedicated renderer per file, keeping the JSON-driven
 * workflow.
 */
const BOUNDS_COLLISION_MODELS = new Set<string>(['phase1/scenes/puerto-fluvial'])

/**` assets don't share
 * that guarantee (each `.glb` was authored at its own unrelated scale), so
 * they keep the `targetSize` bucket picked from the key's folder.
 * @param props - Entity props
 * @returns Model loader or fallback box
 */
export function GenericModelRenderer({ entity }: EntityRendererProps) {
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
    return (
      <ModelLoader
        src={entry.path}
        collisionId={entity.id}
        collisionFallback={BOUNDS_COLLISION_MODELS.has(normalizedKey) ? 'bounds' : 'none'}
        fallback={<FallbackForModel normalizedKey={normalizedKey} />}
      />
    )
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
 * The train — its `.glb`s carry baked wheel-rotation clips (see
 * `TrenAnimado`), so it gets its own renderer instead of the generic
 * `ModelLoader`-based one. It runs in a straight line along its entity's
 * local `+X` (set its `rotationY` to aim it): out of the `rail-tunnel` behind
 * its position, stopping with the model's origin at the entity's position
 * (the station), then on into the tunnel ahead. `variant` picks the model,
 * the complete train by default.
 * @param props - Entity props and the scene's tunnel positions
 * @returns Animated train or fallback
 */
export function TrenRenderer({ entity, context }: EntityRendererProps) {
  const key = entity.variant && TRAIN_KEYS.has(entity.variant) ? entity.variant : 'phase1/vehicles/tren-completo'
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
  return <TrenAnimado src={modelRegistry[key as keyof typeof modelRegistry].path} tunnels={context?.railTunnels} fallback={fallback} />
}

/**
 * @returns Procedural railway tunnel
 */
export function RailTunnelRenderer() {
  return <RailTunnel />
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
export function PuertoBoatRenderer({ entity }: EntityRendererProps) {
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
export function ElPoderosoRenderer(props: EntityRendererProps) {
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
export function ParadeVehicleDispatcher({ entity }: EntityRendererProps) {
  if (entity.variant === 'carrosa-riwi') {
    return <CarrozaRiwiRenderer entity={entity} fallback={<ParadeVehicleFallback />} />
  }
  return <ParadeVehicleRenderer entity={entity} />
}

/**
 * A standalone world collider draws nothing itself: `PhaseEngine`'s
 * `EntityCollider` publishes it and draws it while the editor's collision view is on.
 * @returns Nothing
 */
export function ColliderEntityRenderer() {
  return null
}

/** Rendered for a `type` with no registry entry, so missing types stay visible instead of silently vanishing. */
export function UnknownEntityRenderer({ entity }: EntityRendererProps) {
  console.warn(`[PhaseEngine] Unknown entity type "${entity.type}" (id "${entity.id}") — check entityRegistry.tsx`)
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#ff3b1f" />
    </mesh>
  )
}