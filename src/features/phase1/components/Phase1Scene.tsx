import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PhaseRain } from '@/features/phase1/components/parts/Rain/PhaseRain'
import { ProceduralTree, ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { Phase1Sun, Phase1Clouds } from '@/features/phase1/components/parts/Phase1Environment'
import { GroundDetail } from '@/features/phase1/components/parts/GroundDetail'
import { Phase1Backdrop } from '@/features/phase1/components/parts/Phase1Backdrop'
import { MagdalenaRiver, MAGDALENA_CORRIDOR } from '@/features/phase1/components/parts/MagdalenaRiver'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { initialPhase1Entities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/** Entities farther than this from the camera don't cast shadows (see `PhaseEngine`). */
const SHADOW_DISTANCE = 34

/** How far the distant ground reaches before the backdrop takes over. */
const FAR_GROUND_REACH = 500
/**
 * Y of the distant ground. Just under the town floor so the two never
 * z-fight where they overlap, and — the point of the split below — never
 * above the sunken river, which a single world-spanning plane would cap like
 * a lid and hide completely.
 */
const FAR_GROUND_Y = -0.06

/**
 * The distant ground, as four planes leaving a gap for the river's corridor
 * instead of one plane spanning the world. The bank loft fills that gap: the
 * corridor's edges are where the meandering bank always reaches, so the seams
 * stay covered wherever the river bends.
 */
const FAR_GROUND_PANELS: Array<{ position: [number, number, number]; size: [number, number] }> = [
  {
    position: [(MAGDALENA_CORRIDOR.westX - FAR_GROUND_REACH) / 2, FAR_GROUND_Y, 0],
    size: [MAGDALENA_CORRIDOR.westX + FAR_GROUND_REACH, FAR_GROUND_REACH * 2],
  },
  {
    position: [(MAGDALENA_CORRIDOR.eastX + FAR_GROUND_REACH) / 2, FAR_GROUND_Y, 0],
    size: [FAR_GROUND_REACH - MAGDALENA_CORRIDOR.eastX, FAR_GROUND_REACH * 2],
  },
  {
    position: [
      (MAGDALENA_CORRIDOR.westX + MAGDALENA_CORRIDOR.eastX) / 2,
      FAR_GROUND_Y,
      (MAGDALENA_CORRIDOR.maxZ + FAR_GROUND_REACH) / 2,
    ],
    size: [MAGDALENA_CORRIDOR.eastX - MAGDALENA_CORRIDOR.westX, FAR_GROUND_REACH - MAGDALENA_CORRIDOR.maxZ],
  },
  {
    position: [
      (MAGDALENA_CORRIDOR.westX + MAGDALENA_CORRIDOR.eastX) / 2,
      FAR_GROUND_Y,
      (MAGDALENA_CORRIDOR.minZ - FAR_GROUND_REACH) / 2,
    ],
    size: [MAGDALENA_CORRIDOR.eastX - MAGDALENA_CORRIDOR.westX, FAR_GROUND_REACH + MAGDALENA_CORRIDOR.minZ],
  },
]

/**
 * The phase's authored entities minus its fixed `portal`: outside the editor
 * the way forward is the portal the Libro de Rosa summons in front of the
 * player (see `StoryPortal`), so the authored one stays editable but hidden.
 */
const PLAY_ENTITIES = initialPhase1Entities.filter((e) => e.type !== 'portal')

/**
 * Props for {@link Phase1Lights}.
 */
interface Phase1LightsProps {
  /** Whether it's raining — the light dims and cools under the clouds. */
  raining: boolean
}

/** How much of each light's strength is left under full rain. */
const RAIN_DIMMING = 0.55

/**
 * The barrio's warm afternoon light, dimming smoothly under the rain clouds.
 * @param props - Rain state
 * @returns Lights
 */
const Phase1Lights = memo(function Phase1Lights({ raining }: Phase1LightsProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const hemiRef = useRef<THREE.HemisphereLight>(null)
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const level = useRef(1)
  useFrame((_, delta) => {
    level.current = THREE.MathUtils.damp(level.current, raining ? RAIN_DIMMING : 1, 0.5, Math.min(delta, 0.05))
    if (ambientRef.current) ambientRef.current.intensity = 0.62 * level.current
    if (hemiRef.current) hemiRef.current.intensity = 0.52 * (0.4 + level.current * 0.6)
    if (sunRef.current) sunRef.current.intensity = 1.05 * level.current * level.current
  })
  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.62} color="#ffe9c4" />
      <hemisphereLight ref={hemiRef} args={['#ffecd0', '#6b4a2a', 0.52]} />
      <directionalLight ref={sunRef} position={[40, 34, -24]} intensity={1.05} color="#fff4d0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-90} shadow-camera-right={90} shadow-camera-top={90} shadow-camera-bottom={-90} shadow-camera-far={220} />
      <pointLight position={[30, 5, 10]} intensity={0.42} distance={24} color="#8ab4c2" decay={2} />
    </>
  )
})

/**
 * Props for {@link Phase1Scene}.
 */
interface Phase1SceneProps {
  /** Id of the photo currently highlighted by proximity. */
  highlightedPhotoId?: string | null
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
  /** Whether it's raining over the barrio (towards the end of the narration). */
  raining?: boolean
}

/**
 * Phase 1 scene — Barrio Abajo & the Río Magdalena waterfront (1857–1900).
 * Fully JSON/engine-driven (see `engine/config/phase1.json`): houses, the
 * port/station/boardwalk set pieces, the rail kit and its animated train,
 * port decor and the sepia photos all come from `PhaseEngine`. Only the
 * ground, the river and unauthored atmosphere (backdrop, sun, flood) stay
 * hardcoded here, same as Phase 2's plaza floor and lighting.
 *
 * @param props - Scene props
 * @returns Phase 1 group
 */
export const Phase1Scene = memo(function Phase1Scene({ highlightedPhotoId, editableEntities, raining = false }: Phase1SceneProps) {
  const entities = editableEntities ?? PLAY_ENTITIES

  return (
    <group>
      {FAR_GROUND_PANELS.map((panel) => (
        <mesh key={`${panel.position[0]}-${panel.position[2]}`} rotation-x={-Math.PI / 2} position={panel.position} receiveShadow>
          <planeGeometry args={panel.size} />
          <meshStandardMaterial color="#5a4022" roughness={1} metalness={0} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[-12, 0, 0]} receiveShadow>
        <planeGeometry args={[137, 192]} />
        <meshStandardMaterial color="#6b4a2a" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-12, 0.001, 0]} receiveShadow>
        <planeGeometry args={[135, 190]} />
        <meshStandardMaterial color="#7a5a2e" roughness={0.98} />
      </mesh>
      <gridHelper args={[135, 24, '#5a3d1a', '#7a5a2e']} position={[-12, 0.002, 0]} />
      <GroundDetail />
      <Phase1Backdrop />

      <Phase1Sun />
      <Phase1Clouds />
      <MagdalenaRiver />

      <PhaseEngine entities={entities} context={{ highlightedPhotoId }} shadowDistance={SHADOW_DISTANCE} />

      <ProceduralTree position={[-52, 0, -30]} scale={1.15} foliageColor="#2a5a1e" />
      <ProceduralTree position={[-20, 0, -55]} scale={1.28} foliageColor="#1e4a14" trunkColor="#2e1f14" />
      <ProceduralTree position={[-42, 0, 32]} scale={0.92} foliageColor="#3a6a1e" />
      <ProceduralTree position={[-8, 0, 48]} scale={1.05} foliageColor="#2a5a1e" />
      <ProceduralTree position={[-62, 0, 8]} scale={0.98} foliageColor="#1e3a0f" />
      <ProceduralTree position={[-26, 0, -6]} scale={1.12} foliageColor="#2a4a14" />
      <ProceduralTree position={[-48, 0, 62]} scale={1.08} foliageColor="#2a4a1e" />
      <ProceduralTree position={[-30, 0, -68]} scale={1.02} foliageColor="#3a5a1e" />
      <ProceduralTree position={[-66, 0, -50]} scale={1.1} foliageColor="#2a5a1e" />
      <ProceduralTree position={[-58, 0, 42]} scale={0.95} foliageColor="#1e4a14" />
      <ProceduralTree position={[-14, 0, 70]} scale={1.18} foliageColor="#2a4a1e" />
      <ProceduralTree position={[-36, 0, -82]} scale={1.06} foliageColor="#3a6a1e" />
      <ProceduralTrinitaria position={[-34, 0, -14]} bloomColor="#d82a7a" scale={1} />
      <ProceduralTrinitaria position={[-18, 0, -36]} bloomColor="#7a2ad8" scale={1.1} />
      <ProceduralTrinitaria position={[-54, 0, 22]} bloomColor="#ff6a1a" scale={0.92} />
      <ProceduralTrinitaria position={[-12, 0, 26]} bloomColor="#d82a7a" scale={1.05} />
      <ProceduralTrinitaria position={[-44, 0, -52]} bloomColor="#a52ad8" scale={0.98} />
      <ProceduralTrinitaria position={[-24, 0, 60]} bloomColor="#ff6a1a" scale={1} />
      <ProceduralTrinitaria position={[-64, 0, -10]} bloomColor="#d82a3a" scale={0.9} />
      <ProceduralTrinitaria position={[-6, 0, -60]} bloomColor="#7a2ad8" scale={1.02} />

      <ProceduralTree position={[6, 0, -20]} scale={1.08} foliageColor="#2a5a1e" />
      <ProceduralTree position={[15, 0, 40]} scale={0.96} foliageColor="#3a6a1e" />
      <ProceduralTree position={[-8, 0, 22]} scale={1.1} foliageColor="#1e4a14" />
      <ProceduralTree position={[10, 0, 85]} scale={1.02} foliageColor="#2a4a1e" />
      <ProceduralTree position={[18, 0, -85]} scale={1.14} foliageColor="#2a5a1e" trunkColor="#2e1f14" />
      <ProceduralTree position={[0, 0, -30]} scale={0.9} foliageColor="#3a5a1e" />
      <ProceduralTree position={[8, 0, 55]} scale={1.04} foliageColor="#1e3a0f" />
      <ProceduralTree position={[-4, 0, 90]} scale={1.06} foliageColor="#2a4a14" />
      <ProceduralTrinitaria position={[5, 0, 30]} bloomColor="#d82a7a" scale={1} />
      <ProceduralTrinitaria position={[12, 0, -25]} bloomColor="#ff6a1a" scale={0.94} />
      <ProceduralTrinitaria position={[2, 0, 65]} bloomColor="#a52ad8" scale={1.03} />
      <ProceduralTrinitaria position={[16, 0, 90]} bloomColor="#d82a3a" scale={0.96} />

      <Phase1Lights raining={raining} />
      <PhaseRain active={raining} />
    </group>
  )
})
