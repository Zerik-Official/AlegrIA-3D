import { memo, useMemo } from 'react'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { SceneStars } from '@/shared/components/SceneAtmosphere'
import { CityFillerSkyline } from '@/features/cityIntro/components/CityFillerSkyline'
import { buildFlightLanes } from '@/features/cityIntro/renderers/flightLane'
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
/** Center/size of the plain dark ground plane, sized to clear the road strip and skyline filler on every side. */
const GROUND_CENTER_Z = 7
const GROUND_SIZE: [number, number] = [280, 180]

/**
 * Escena -1 — a futuristic city street the player walks (camera on rails,
 * look-only) from the city toward an abandoned library glimpsed at the end
 * of the road. Static street/sidewalk geometry lives here; every skyscraper,
 * streetlight, flying vehicle, the moon and the library facade are JSON-driven
 * through `PhaseEngine` (`engine/config/cityIntro.json`), fully editable via `F2`.
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
      <SceneStars count={1400} radius={260} color="#eaf2ff" />
      <CityFillerSkyline />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, GROUND_CENTER_Z]} receiveShadow>
        <planeGeometry args={GROUND_SIZE} />
        <meshStandardMaterial color="#0d0e14" roughness={0.85} metalness={0.15} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, (ROAD_FROM_Z + ROAD_TO_Z) / 2]} receiveShadow>
        <planeGeometry args={[8.6, ROAD_FROM_Z - ROAD_TO_Z]} />
        <meshStandardMaterial color="#15161c" roughness={0.7} metalness={0.2} />
      </mesh>

      {[-4.6, 4.6].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.01, (ROAD_FROM_Z + ROAD_TO_Z) / 2]} receiveShadow>
          <planeGeometry args={[2.4, ROAD_FROM_Z - ROAD_TO_Z]} />
          <meshStandardMaterial color="#232530" roughness={0.9} />
        </mesh>
      ))}

      {[-3.55, 3.55].map((x) => (
        <mesh key={x} position={[x, 0.03, (ROAD_FROM_Z + ROAD_TO_Z) / 2]}>
          <boxGeometry args={[0.06, 0.04, ROAD_FROM_Z - ROAD_TO_Z]} />
          <meshStandardMaterial color="#5ad8ff" emissive="#5ad8ff" emissiveIntensity={0.9} />
        </mesh>
      ))}

      {laneDashes.map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.008, z]}>
          <planeGeometry args={[0.22, 1.4]} />
          <meshStandardMaterial color="#ffcf6b" emissive="#ffcf6b" emissiveIntensity={0.5} />
        </mesh>
      ))}

      <PhaseEngine entities={entities} context={{ flightLanes }} />

      <ambientLight intensity={0.22} color="#8fa8ff" />
      <hemisphereLight args={['#3a2a5a', '#0a0a16', 0.4]} />
    </group>
  )
})
