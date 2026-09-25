import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { CARIBBEAN_BLUE, SOLAR_YELLOW } from '@/features/cityIntro/config/colorPalette'
import { AVENUE_CURB_X, AVENUE_SIDEWALK_OUTER_X, PLAZAS, SIDEWALK_WIDTH, SIDE_STREET, type Plaza } from '@/features/cityIntro/config/cityStreets'

/**
 * Z span the avenue's strips and lane dashes run across. `ROAD_FROM_Z`
 * reaches well past the walk's starting point (path-0 at z=22) so looking
 * back from the start doesn't reveal the ground's edge nearby.
 */
const ROAD_FROM_Z = 75
const ROAD_TO_Z = -60
/** Spacing of the lane dashes. */
const DASH_STEP = 3.2
/** Where the side street's mouth cuts the avenue's east sidewalk and curb. */
const JUNCTION_NORTH_Z = SIDE_STREET.centerZ + SIDE_STREET.curbHalf
const JUNCTION_SOUTH_Z = SIDE_STREET.centerZ - SIDE_STREET.curbHalf

/** Shared materials for the paving. */
const mats = {
  asphalt: new THREE.MeshStandardMaterial({ color: '#3a2a2e', roughness: 0.8, metalness: 0.1 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: '#6b4a3a', roughness: 0.95 }),
  plaza: new THREE.MeshStandardMaterial({ color: '#7a5646', roughness: 0.9 }),
  curb: new THREE.MeshStandardMaterial({ color: SOLAR_YELLOW, emissive: SOLAR_YELLOW, emissiveIntensity: 0.7, roughness: 0.8 }),
  dash: new THREE.MeshStandardMaterial({ color: CARIBBEAN_BLUE, emissive: CARIBBEAN_BLUE, emissiveIntensity: 0.55 }),
}

/**
 * A flat strip on the ground, given by its extent.
 * @param props - `[minX, maxX, minZ, maxZ]`, height and material
 * @returns Plane mesh
 */
function GroundStrip({ area: [minX, maxX, minZ, maxZ], y, material }: { area: [number, number, number, number]; y: number; material: THREE.Material }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[(minX + maxX) / 2, y, (minZ + maxZ) / 2]} material={material} receiveShadow>
      <planeGeometry args={[maxX - minX, maxZ - minZ]} />
    </mesh>
  )
}

/**
 * A glowing curb line, given by its extent.
 * @param props - `[minX, maxX, minZ, maxZ]`
 * @returns Box mesh
 */
function CurbLine({ area: [minX, maxX, minZ, maxZ] }: { area: [number, number, number, number] }) {
  return (
    <mesh position={[(minX + maxX) / 2, 0.03, (minZ + maxZ) / 2]} material={mats.curb}>
      <boxGeometry args={[Math.max(0.1, maxX - minX), 0.06, Math.max(0.1, maxZ - minZ)]} />
    </mesh>
  )
}

/**
 * A walk from the avenue to a landmark: warm paving framed by solar-yellow
 * edges, with two neon guide lines leading the eye to the building.
 * @param props - Plaza
 * @returns Plaza group
 */
const PlazaWalk = memo(function PlazaWalk({ plaza }: { plaza: Plaza }) {
  const [minX, maxX, minZ, maxZ] = plaza.area
  const midZ = (minZ + maxZ) / 2
  const guide = useMemo(() => new THREE.MeshStandardMaterial({ color: plaza.accent, emissive: plaza.accent, emissiveIntensity: 1.1 }), [plaza.accent])
  return (
    <group>
      <GroundStrip area={plaza.area} y={0.012} material={mats.plaza} />
      <CurbLine area={[minX, maxX, minZ, minZ + 0.1]} />
      <CurbLine area={[minX, maxX, maxZ - 0.1, maxZ]} />
      {[-1.3, 1.3].map((dz) => (
        <mesh key={dz} rotation-x={-Math.PI / 2} position={[(minX + maxX) / 2, 0.016, midZ + dz]} material={guide}>
          <planeGeometry args={[maxX - minX - 0.6, 0.14]} />
        </mesh>
      ))}
    </group>
  )
})

/**
 * The future city's paving: the main avenue (asphalt, sidewalks, curbs and
 * lane dashes), the side street turning right in front of the aduana — with
 * the avenue's east sidewalk and curb cut open at its mouth — and the plazas
 * opening onto RIWI's building and the two screen buildings.
 *
 * @returns Streets group
 */
export const CityStreets = memo(function CityStreets() {
  const avenueDashes = useMemo(() => {
    const dashes: number[] = []
    for (let z = ROAD_FROM_Z; z > ROAD_TO_Z; z -= DASH_STEP) dashes.push(z)
    return dashes
  }, [])
  const sideDashes = useMemo(() => {
    const dashes: number[] = []
    for (let x = AVENUE_SIDEWALK_OUTER_X + 1.6; x < SIDE_STREET.toX - 1; x += DASH_STEP) dashes.push(x)
    return dashes
  }, [])

  const sidewalkInnerX = AVENUE_SIDEWALK_OUTER_X - SIDEWALK_WIDTH
  const northEdgeZ = JUNCTION_NORTH_Z + SIDEWALK_WIDTH
  const sideEndX = SIDE_STREET.toX + SIDEWALK_WIDTH

  return (
    <group>
      <GroundStrip area={[-4.3, 4.3, ROAD_TO_Z, ROAD_FROM_Z]} y={0.006} material={mats.asphalt} />
      <GroundStrip area={[-AVENUE_SIDEWALK_OUTER_X, -sidewalkInnerX, ROAD_TO_Z, ROAD_FROM_Z]} y={0.01} material={mats.sidewalk} />
      <GroundStrip area={[sidewalkInnerX, AVENUE_SIDEWALK_OUTER_X, JUNCTION_NORTH_Z, ROAD_FROM_Z]} y={0.01} material={mats.sidewalk} />
      <GroundStrip area={[sidewalkInnerX, AVENUE_SIDEWALK_OUTER_X, ROAD_TO_Z, JUNCTION_SOUTH_Z]} y={0.01} material={mats.sidewalk} />
      <CurbLine area={[-AVENUE_CURB_X - 0.05, -AVENUE_CURB_X + 0.05, ROAD_TO_Z, ROAD_FROM_Z]} />
      <CurbLine area={[AVENUE_CURB_X - 0.05, AVENUE_CURB_X + 0.05, JUNCTION_NORTH_Z, ROAD_FROM_Z]} />
      <CurbLine area={[AVENUE_CURB_X - 0.05, AVENUE_CURB_X + 0.05, ROAD_TO_Z, JUNCTION_SOUTH_Z]} />
      {avenueDashes.map((z) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.008, z]} material={mats.dash}>
          <planeGeometry args={[0.22, 1.4]} />
        </mesh>
      ))}

      <GroundStrip area={[AVENUE_CURB_X, SIDE_STREET.toX, JUNCTION_SOUTH_Z, JUNCTION_NORTH_Z]} y={0.007} material={mats.asphalt} />
      <GroundStrip area={[AVENUE_SIDEWALK_OUTER_X, sideEndX, JUNCTION_NORTH_Z, northEdgeZ]} y={0.011} material={mats.sidewalk} />
      <GroundStrip area={[AVENUE_SIDEWALK_OUTER_X, sideEndX, SIDE_STREET.southLimitZ, JUNCTION_SOUTH_Z]} y={0.011} material={mats.sidewalk} />
      <GroundStrip area={[SIDE_STREET.toX, sideEndX, JUNCTION_SOUTH_Z, JUNCTION_NORTH_Z]} y={0.011} material={mats.sidewalk} />
      <CurbLine area={[AVENUE_SIDEWALK_OUTER_X, SIDE_STREET.toX, JUNCTION_NORTH_Z - 0.05, JUNCTION_NORTH_Z + 0.05]} />
      <CurbLine area={[AVENUE_SIDEWALK_OUTER_X, SIDE_STREET.toX, JUNCTION_SOUTH_Z - 0.05, JUNCTION_SOUTH_Z + 0.05]} />
      <CurbLine area={[SIDE_STREET.toX - 0.05, SIDE_STREET.toX + 0.05, JUNCTION_SOUTH_Z, JUNCTION_NORTH_Z]} />
      {sideDashes.map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[x, 0.009, SIDE_STREET.centerZ]} material={mats.dash}>
          <planeGeometry args={[0.22, 1.4]} />
        </mesh>
      ))}

      {PLAZAS.map((plaza) => (
        <PlazaWalk key={plaza.id} plaza={plaza} />
      ))}
    </group>
  )
})
