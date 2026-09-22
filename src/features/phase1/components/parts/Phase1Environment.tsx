import { memo } from 'react'
import { SceneSun, SceneClouds } from '@/shared/components/SceneAtmosphere'

/**
 * Phase 1's sun — warm 1857–1900 daylight over Barrio Abajo.
 * Thin wrapper around the reusable {@link SceneSun}.
 *
 * @returns Environment group
 */
export const Phase1Sun = memo(function Phase1Sun() {
  return <SceneSun position={[18, 14, -12]} hemisphere={{ sky: '#ffecd0', ground: '#6b4a2a', intensity: 0.52 }} />
})

/**
 * Phase 1's drifting clouds. Thin wrapper around the reusable {@link SceneClouds}.
 *
 * @returns Clouds group
 */
export const Phase1Clouds = memo(function Phase1Clouds() {
  return <SceneClouds count={7} rangeZ={[-26, -8]} rangeY={[8.5, 12]} color="#ffffff" underColor="#f0dcc0" />
})
