/**
 * Maps entity types in the `cityIntro` scene to their renderers and is merged
 * into the `entityRegistry` export from `engine/entityRegistry`. Each renderer
 * is defined in a separate file because it is specific to this scene; the
 * engine only needs this map, not the renderer geometry.
 *
 * The "Futurismo Abajero 2050" set includes a neo-heritage house, cultural
 * mural, floating streetlight, curb, and oak tree. The original cyberpunk
 * types remain registered to preserve compatibility with scenes exported
 * from the editor.
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
import { MeshTowerRenderer, NeedleTowerRenderer, NeonBenchRenderer, NeonPlanterRenderer } from '@/features/cityIntro/renderers/FuturisticPropRenderers'
import { ScreenBuildingRenderer } from '@/features/cityIntro/renderers/ScreenBuildingRenderer'
import { NeoHeritageHouseRenderer } from '@/features/cityIntro/renderers/NeoHeritageHouseRenderer'
import { CultureMuralRenderer } from '@/features/cityIntro/renderers/CultureMuralRenderer'
import { FloatingFaroleRenderer } from '@/features/cityIntro/renderers/FloatingFaroleRenderer'
import { CurbRenderer, YellowTreeRenderer } from '@/features/cityIntro/renderers/AbajeroStreetProps'
import { RiwiBarranquillaRenderer } from '@/features/cityIntro/renderers/RiwiBarranquillaRenderer'
import { AdBusRenderer } from '@/features/cityIntro/renderers/AdBusRenderer'
import { StreetJukeboxCarRenderer } from '@/features/cityIntro/renderers/StreetJukeboxCarRenderer'
import { ConcertStageRenderer } from '@/features/cityIntro/renderers/concert/ConcertStageRenderer'
import type { EntityRenderer } from '@/engine/types'

export const cityIntroRenderers: Record<string, EntityRenderer> = {
  'concert-stage': ConcertStageRenderer,
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
  'screen-building': ScreenBuildingRenderer,
  'mesh-tower': MeshTowerRenderer,
  'needle-tower': NeedleTowerRenderer,
  'neon-bench': NeonBenchRenderer,
  'neon-planter': NeonPlanterRenderer,
  'neo-heritage-house': NeoHeritageHouseRenderer,
  'culture-mural': CultureMuralRenderer,
  'floating-farol': FloatingFaroleRenderer,
  'anden-bordillo': CurbRenderer,
  'roble-amarillo': YellowTreeRenderer,
  'riwi-barranquilla': RiwiBarranquillaRenderer,
  'ad-bus': AdBusRenderer,
  'street-jukebox-car': StreetJukeboxCarRenderer,
}
