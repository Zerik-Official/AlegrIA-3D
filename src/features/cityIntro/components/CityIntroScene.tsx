import { memo, useMemo } from 'react'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { SceneStars } from '@/shared/components/SceneAtmosphere'
import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link CityIntroScene}.
 */
interface CityIntroSceneProps {
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

/** Z span the road/sidewalk strips and lane dashes run across. */
const ROAD_FROM_Z = 26
const ROAD_TO_Z = -50

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
  const laneDashes = useMemo(() => {
    const dashes: number[] = []
    for (let z = ROAD_FROM_Z; z > ROAD_TO_Z; z -= 3.2) dashes.push(z)
    return dashes
  }, [])

  return (
    <group>
      <SceneStars count={1100} radius={140} color="#eaf2ff" />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -12]} receiveShadow>
        <planeGeometry args={[60, 90]} />
        <meshStandardMaterial color="#0d0e14" roughness={0.85} metalness={0.15} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, -12]} receiveShadow>
        <planeGeometry args={[8.6, 82]} />
        <meshStandardMaterial color="#15161c" roughness={0.7} metalness={0.2} />
      </mesh>

      {[-4.6, 4.6].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.01, -12]} receiveShadow>
          <planeGeometry args={[2.4, 82]} />
          <meshStandardMaterial color="#232530" roughness={0.9} />
        </mesh>
      ))}

      {[-3.55, 3.55].map((x) => (
        <mesh key={x} position={[x, 0.03, -12]}>
          <boxGeometry args={[0.06, 0.04, 82]} />
          <meshStandardMaterial color="#5ad8ff" emissive="#5ad8ff" emissiveIntensity={0.9} />
        </mesh>
      ))}

      {laneDashes.map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.008, z]}>
          <planeGeometry args={[0.22, 1.4]} />
          <meshStandardMaterial color="#ffcf6b" emissive="#ffcf6b" emissiveIntensity={0.5} />
        </mesh>
      ))}

      <PhaseEngine entities={entities} />

      <ambientLight intensity={0.22} color="#8fa8ff" />
      <hemisphereLight args={['#3a2a5a', '#0a0a16', 0.4]} />
    </group>
  )
})
