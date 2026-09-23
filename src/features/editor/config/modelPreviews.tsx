/**
 * Maps each `modelRegistry` key to the actual procedural fallback it renders
 * in-game, so the editor's Model Browser shows our real generic design when
 * no `.glb` is present instead of a generic placeholder box.
 * @module features/editor/config/modelPreviews
 */

import type { ComponentType } from 'react'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { ProceduralCyberWall } from '@/features/library/components/CyberWall'
import { Pedestal } from '@/features/pedestal/components/Pedestal'
import { ProceduralBookGeometry } from '@/features/pedestal/components/LevitatingBook'
import { BaharequeHouse } from '@/features/phase1/components/parts/BaharequeHouse'
import { AndenAlto } from '@/features/phase1/components/parts/AndenAlto'
import { SepiaPhotoFrame } from '@/features/phase1/components/parts/SepiaPhotoFrame'
import { ProceduralPortal, ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { ColorfulFacade, GothicTemple } from '@/features/phase2/components/Phase2Scene'
import { ScenePlanet } from '@/shared/components/SceneAtmosphere'
import { ProceduralSkyscraper } from '@/features/cityIntro/renderers/SkyscraperRenderer'
import { ProceduralStreetlight } from '@/features/cityIntro/renderers/StreetlightRenderer'
import { ProceduralFlyingCar } from '@/features/cityIntro/renderers/FlyingCarRenderer'
import { ProceduralFlyingTrain } from '@/features/cityIntro/renderers/FlyingTrainRenderer'
import { ProceduralMoon } from '@/features/cityIntro/renderers/MoonRenderer'
import { ProceduralLibraryFacade } from '@/features/cityIntro/renderers/LibraryFacadeRenderer'

/**
 * `modelRegistry` key → the same procedural component the game itself falls
 * back to for that key. Keys with no entry here (e.g. still-unbuilt museum
 * assets) fall through to the browser's generic placeholder.
 */
export const modelPreviews: Record<string, ComponentType> = {
  'library/bookshelf': () => <Bookshelf position={[0, 0, 0]} />,
  'library/cyber-wall': () => <ProceduralCyberWall position={[0, 0, 0]} size={[4, 2.4, 0.3]} />,
  'pedestal/base': Pedestal,
  'pedestal/book': ProceduralBookGeometry,
  'phase1/bahareque-house-short': () => <BaharequeHouse position={[0, 0, 0]} variant="short" />,
  'phase1/bahareque-house-medium': () => <BaharequeHouse position={[0, 0, 0]} variant="medium" />,
  'phase1/bahareque-house-long': () => <BaharequeHouse position={[0, 0, 0]} variant="long" />,
  'phase1/bahareque-house': () => <BaharequeHouse position={[0, 0, 0]} />,
  'phase1/anden-alto': () => <AndenAlto position={[0, 0, 0]} />,
  'phase1/sepia-photo': () => <SepiaPhotoFrame position={[0, 0, 0]} />,
  'phase1/portal': () => <ProceduralPortal position={[0, 0, 0]} />,
  'phase2/facade': () => <ColorfulFacade position={[0, 0, 0]} color="#e85a3a" />,
  'phase2/temple': () => <GothicTemple position={[0, 0, 0]} />,
  'phase2/trinitaria': () => <ProceduralTrinitaria position={[0, 0, 0]} />,
  'phase2/portal': () => <ProceduralPortal position={[0, 0, 0]} />,
  'cityIntro/skyscraper': ProceduralSkyscraper,
  'cityIntro/streetlight': ProceduralStreetlight,
  'cityIntro/flying-car-retro': ProceduralFlyingCar,
  'cityIntro/flying-car-star': ProceduralFlyingCar,
  'cityIntro/flying-car-classic': ProceduralFlyingCar,
  'cityIntro/flying-train': ProceduralFlyingTrain,
  'cityIntro/moon': ProceduralMoon,
  'cityIntro/library-facade': ProceduralLibraryFacade,
  'cityIntro/planet': ScenePlanet,
}
