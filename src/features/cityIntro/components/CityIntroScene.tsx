import { memo, useEffect, useMemo } from 'react'
import { Sparkles } from '@react-three/drei'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { CityFillerSkyline } from '@/features/cityIntro/components/CityFillerSkyline'
import { CityStreets } from '@/features/cityIntro/components/CityStreets'
import { StreetCarnival } from '@/features/cityIntro/components/carnival/StreetCarnival'
import { CreditsDoorPortal } from '@/features/cityIntro/renderers/CreditsDoorPortal'
import { cityCollisionSolids } from '@/features/cityIntro/config/cityCollision'
import { registerCollisionSolids, unregisterCollisionSolids } from '@/features/player/collision'
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
 * Escena -1 — "Futurismo Abajero 2050": la calle que el jugador recorre
 * (cámara sobre rieles, solo mirar) desde el barrio hacia la biblioteca que
 * se asoma al final. No es la ciudad cyberpunk genérica: es Barrio Abajo
 * tecnificado, de un piso, en un atardecer caribeño neón.
 *
 * La calzada, los andenes, la calle lateral frente a la aduana y las plazas
 * hacia RIWI y los edificios de pantalla viven en `CityStreets`; la fiesta
 * "Baila la Calle 2050" que llena la avenida (multitud, banderines, hologramas,
 * puestos y luces al ritmo) vive en `StreetCarnival`; las casas, murales,
 * faroles flotantes, robles, vehículos, la luna y la fachada de la biblioteca
 * son JSON (`engine/config/cityIntro.json`) a través de `PhaseEngine`, todas
 * editables con `F2`.
 *
 * @param props - Scene props
 * @returns City intro group
 */
export const CityIntroScene = memo(function CityIntroScene({ editableEntities }: CityIntroSceneProps) {
  const entities = editableEntities ?? initialCityIntroEntities
  const flightLanes = useMemo(() => buildFlightLanes(entities), [entities])
  const walkPath = useMemo(() => entities.filter((e) => e.type === 'path-point'), [entities])

  useEffect(() => {
    registerCollisionSolids('city-sidewalk-slabs', cityCollisionSolids)
    return () => unregisterCollisionSolids('city-sidewalk-slabs')
  }, [])

  return (
    <group>
      <CaribbeanSky />
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
