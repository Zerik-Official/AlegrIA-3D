/**
 * Renderer map for the `cityIntro` scene's entity types, merged into
 * `engine/entityRegistry`'s `entityRegistry` export. Each renderer lives in
 * its own file here (not in `engine/`) because it's entirely specific to this
 * scene's content — the engine itself only needs the map, not the geometry.
 *
 * El bloque "Futurismo Abajero 2050" (casa neopatrimonial, mural cultural,
 * farol flotante, andén y roble) es el que da la identidad caribeña de la
 * fase; los tipos cyberpunk originales (rascacielos, torres, banca/maceta de
 * neón) siguen registrados para no romper escenas ya exportadas del editor.
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
import { PoderosoPremiumRenderer } from '@/features/cityIntro/renderers/PoderosoPremiumRenderer'
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
  'poderoso-premium': PoderosoPremiumRenderer,
}
