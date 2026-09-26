/**
 * Renderer registry mapping `EditableEntity.type` to the component that paints it.
 * This is the single place that knows how to turn a JSON entity into a mesh/model —
 * `PhaseEngine` just looks types up here, so adding a new scene element never requires
 * touching `PhaseEngine` itself, only registering it below (and, for the editor's
 * "add element" palette, `engine/config/entityCatalog`). The renderers themselves
 * live in `engine/renderers/coreRenderers` and each scene's renderer modules.
 * @module engine/entityRegistry
 */

import { modelRegistry } from '@/shared/config/models'
import {
  BahareqHouseRenderer,
  BookRenderer,
  BookshelfRenderer,
  CarnivalHouseRenderer,
  ColliderEntityRenderer,
  CongasRenderer,
  CyberWallRenderer,
  DancerRenderer,
  ElPoderosoRenderer,
  FacadeRenderer,
  GenericModelRenderer,
  ParadeVehicleDispatcher,
  ParroquiaRenderer,
  PedestalRenderer,
  PortalRenderer,
  PuertoBoatRenderer,
  RailTunnelRenderer,
  ReyMomoRenderer,
  SepiaPhotoRenderer,
  TempleRenderer,
  TrenRenderer,
  TrinitariaRenderer,
  UnknownEntityRenderer,
} from '@/engine/renderers/coreRenderers'
import { cityIntroRenderers } from '@/features/cityIntro/renderers'
import { skyRenderers } from '@/shared/renderers/skyRenderers'
import { WalkAreaRenderer } from '@/features/player/renderers/WalkAreaRenderer'
import type { EntityRenderer } from '@/engine/types'

export type { EntityRenderer, EntityRendererProps } from '@/engine/types'

/**
 * Registry of entity renderers keyed by `EditableEntity.type`.
 * To add a new scene element: write its renderer, register it here, and (optionally)
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
  'congas-personaje': CongasRenderer,
  'parade-vehicle': ParadeVehicleDispatcher,
  'phase2/decorations/el-poderoso': ElPoderosoRenderer,
  'phase2-house': GenericModelRenderer,
  'phase2-floor': GenericModelRenderer,
  'phase2-decoration': GenericModelRenderer,
  'phase2-scene': GenericModelRenderer,
  'phase2-model': GenericModelRenderer,
  'phase1-train': TrenRenderer,
  'rail-tunnel': RailTunnelRenderer,
  'phase1/decorators/decorativos-bote-canoa': PuertoBoatRenderer,
  'phase1/decorators/decorativos-bote-chalupa': PuertoBoatRenderer,
  'phase1/decorators/decorativos-vapor-fluvial': PuertoBoatRenderer,
  'phase1-floor': GenericModelRenderer,
  'phase1-decoration': GenericModelRenderer,
  'phase1-scene': GenericModelRenderer,
  'phase1-vehicle': GenericModelRenderer,
  'phase1-model': GenericModelRenderer,
  collider: ColliderEntityRenderer,
  'walk-area': WalkAreaRenderer,
  ...cityIntroRenderers,
  ...skyRenderers,
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
