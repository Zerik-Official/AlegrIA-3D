import { memo, useMemo } from 'react'
import { Sparkles } from '@react-three/drei'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { CityFillerSkyline } from '@/features/cityIntro/components/CityFillerSkyline'
import { CityStreets } from '@/features/cityIntro/components/CityStreets'
import { StreetCarnival } from '@/features/cityIntro/components/carnival/StreetCarnival'
import { CreditsDoorPortal } from '@/features/cityIntro/renderers/CreditsDoorPortal'
import { CaribbeanSky } from '@/features/cityIntro/components/CaribbeanSky'
import { buildFlightLanes } from '@/features/cityIntro/renderers/flightLane'
import { NEON_MAGENTA, SOLAR_YELLOW, SUNSET_ORANGE } from '@/features/cityIntro/config/colorPalette'
import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link CityIntroScene}.
 */
interface CityIntroSceneProps {
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

/** Center/size of the plain ground plane, sized to clear the road strip and skyline filler on every side. */
const GROUND_CENTER_Z = 7
const GROUND_SIZE: [number, number] = [280, 180]

/**
 * Scene -1 — "Futurismo Abajero 2050": the street the player traverses
 * (rail camera, look-only) from the neighborhood toward the library that
 * comes into view at the end.
 *
 * @param props - Scene props
 * @returns City intro group
 */
export const CityIntroScene = memo(function CityIntroScene({ editableEntities }: CityIntroSceneProps) {
  const entities = editableEntities ?? initialCityIntroEntities
  const flightLanes = useMemo(() => buildFlightLanes(entities), [entities])
  const walkPath = useMemo(() => entities.filter((e) => e.type === 'path-point'), [entities])
  const sunPosition = entities.find((e) => e.type === 'sun')?.position

  return (
    <group>
      <CaribbeanSky sunPosition={sunPosition} />
      <CityFillerSkyline />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, GROUND_CENTER_Z]} receiveShadow>
        <planeGeometry args={GROUND_SIZE} />
        <meshStandardMaterial color="#3a2420" roughness={0.95} metalness={0.05} />
      </mesh>

      <CityStreets />
      <StreetCarnival pathEntities={walkPath} />
      <CreditsDoorPortal />

      <PhaseEngine entities={entities} context={{ flightLanes }} />

      <Sparkles count={45} scale={[46, 10, 110]} position={[0, 5, 0]} size={2.4} speed={0.18} color={SOLAR_YELLOW} opacity={0.4} />

      <ambientLight intensity={0.5} color={SUNSET_ORANGE} />
      <hemisphereLight args={[NEON_MAGENTA, '#4a2a1a', 0.75]} />
    </group>
  )
})
