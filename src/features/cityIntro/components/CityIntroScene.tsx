import { memo, useMemo } from 'react'
import { Sparkles } from '@react-three/drei'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { CityFillerSkyline } from '@/features/cityIntro/components/CityFillerSkyline'
import { CaribbeanSky } from '@/features/cityIntro/components/CaribbeanSky'
import { buildFlightLanes } from '@/features/cityIntro/renderers/flightLane'
import { CARIBBEAN_BLUE, NEON_MAGENTA, SOLAR_YELLOW, SUNSET_ORANGE } from '@/features/cityIntro/config/colorPalette'
import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link CityIntroScene}.
 */
interface CityIntroSceneProps {
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

/**
 * Z span the road/sidewalk strips and lane dashes run across. `ROAD_FROM_Z`
 * reaches well past the walk's starting point (path-0 at z=22) so looking
 * back from the start doesn't reveal the ground's edge nearby.
 */
const ROAD_FROM_Z = 75
const ROAD_TO_Z = -60
/** Center/size of the plain ground plane, sized to clear the road strip and skyline filler on every side. */
const GROUND_CENTER_Z = 7
const GROUND_SIZE: [number, number] = [280, 180]

/**
 * Escena -1 — "Futurismo Abajero 2050": la calle que el jugador recorre
 * (cámara sobre rieles, solo mirar) desde el barrio hacia la biblioteca que
 * se asoma al final. No es la ciudad cyberpunk genérica: es Barrio Abajo
 * tecnificado, de un piso, en un atardecer caribeño neón.
 *
 * La geometría estática de calzada y andenes vive aquí; las casas, murales,
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
  const laneDashes = useMemo(() => {
    const dashes: number[] = []
    for (let z = ROAD_FROM_Z; z > ROAD_TO_Z; z -= 3.2) dashes.push(z)
    return dashes
  }, [])

  return (
    <group>
      <CaribbeanSky />
      <CityFillerSkyline />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, GROUND_CENTER_Z]} receiveShadow>
        <planeGeometry args={GROUND_SIZE} />
        <meshStandardMaterial color="#3a2420" roughness={0.95} metalness={0.05} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, (ROAD_FROM_Z + ROAD_TO_Z) / 2]} receiveShadow>
        <planeGeometry args={[8.6, ROAD_FROM_Z - ROAD_TO_Z]} />
        <meshStandardMaterial color="#3a2a2e" roughness={0.8} metalness={0.1} />
      </mesh>

      {[-4.6, 4.6].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.01, (ROAD_FROM_Z + ROAD_TO_Z) / 2]} receiveShadow>
          <planeGeometry args={[2.4, ROAD_FROM_Z - ROAD_TO_Z]} />
          <meshStandardMaterial color="#6b4a3a" roughness={0.95} />
        </mesh>
      ))}

      {[-3.55, 3.55].map((x) => (
        <mesh key={x} position={[x, 0.03, (ROAD_FROM_Z + ROAD_TO_Z) / 2]}>
          <boxGeometry args={[0.1, 0.06, ROAD_FROM_Z - ROAD_TO_Z]} />
          <meshStandardMaterial color={SOLAR_YELLOW} emissive={SOLAR_YELLOW} emissiveIntensity={0.7} roughness={0.8} />
        </mesh>
      ))}

      {laneDashes.map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.008, z]}>
          <planeGeometry args={[0.22, 1.4]} />
          <meshStandardMaterial color={CARIBBEAN_BLUE} emissive={CARIBBEAN_BLUE} emissiveIntensity={0.55} />
        </mesh>
      ))}

      <PhaseEngine entities={entities} context={{ flightLanes }} />

      <Sparkles count={70} scale={[46, 10, 110]} position={[0, 5, 0]} size={2.4} speed={0.18} color={SOLAR_YELLOW} opacity={0.4} />

      <ambientLight intensity={0.5} color={SUNSET_ORANGE} />
      <hemisphereLight args={[NEON_MAGENTA, '#4a2a1a', 0.75]} />
    </group>
  )
})
