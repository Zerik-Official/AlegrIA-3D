/**
 * Renderer map for the `cityIntro` scene's entity types, merged into
 * `engine/entityRegistry`'s `entityRegistry` export. Each renderer lives in
 * its own file here (not in `engine/`) because it's entirely specific to this
 * scene's content — the engine itself only needs the map, not the geometry.
 * @module features/cityIntro/renderers
 */

import { SkyscraperRenderer } from '@/features/cityIntro/renderers/SkyscraperRenderer'
import { StreetlightRenderer } from '@/features/cityIntro/renderers/StreetlightRenderer'
import { FlyingCarRenderer } from '@/features/cityIntro/renderers/FlyingCarRenderer'
import { FlyingTrainRenderer } from '@/features/cityIntro/renderers/FlyingTrainRenderer'
import { MoonRenderer } from '@/features/cityIntro/renderers/MoonRenderer'
import { PlanetRenderer } from '@/features/cityIntro/renderers/PlanetRenderer'
import { LibraryFacadeRenderer } from '@/features/cityIntro/renderers/LibraryFacadeRenderer'
import { PathPointRenderer } from '@/features/cityIntro/renderers/PathPointRenderer'
import { FlightLanePointRenderer } from '@/features/cityIntro/renderers/FlightLanePointRenderer'
import { AdTowerRenderer } from '@/features/cityIntro/renderers/AdTowerRenderer'
import { RiwiBuildingRenderer } from '@/features/cityIntro/renderers/RiwiBuildingRenderer'
import type { EntityRenderer } from '@/engine/types'

export const cityIntroRenderers: Record<string, EntityRenderer> = {
  skyscraper: SkyscraperRenderer,
  streetlight: StreetlightRenderer,
  'flying-car': FlyingCarRenderer,
  'flying-train': FlyingTrainRenderer,
  moon: MoonRenderer,
  planet: PlanetRenderer,
  'library-facade': LibraryFacadeRenderer,
  'path-point': PathPointRenderer,
  'flight-lane-point': FlightLanePointRenderer,
  'ad-tower': AdTowerRenderer,
  'riwi-building': RiwiBuildingRenderer,
}
