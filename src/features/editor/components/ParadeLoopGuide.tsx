/**
 * Draws Phase 2's parade-vehicle loop (see `paradeLoop.getParadeLoopCurve`)
 * while the editor's collision view is on, since that curve is baked in code
 * and has no JSON/collider representation an editor could otherwise show —
 * without this, nothing in the editor flags an entity dragged onto it.
 * @module features/editor/components/ParadeLoopGuide
 */

import { memo, useMemo } from 'react'
import { Line } from '@react-three/drei'
import type { SceneId } from '@/engine/config/entityCatalog'
import { useCollisionDebugVisible } from '@/features/editor/state/collisionDebug'
import { getParadeLoopCurve } from '@/features/phase2/renderers/paradeLoop'

/** Color of the loop guide, distinct from every collider debug color. */
const LOOP_COLOR = '#ff3cf0'

/** Points sampled along the loop curve for the guide line. */
const SAMPLE_COUNT = 128

/**
 * @param scene - Scene currently open in the editor
 * @returns The loop guide, or nothing outside phase2 or while colliders are hidden
 */
export const ParadeLoopGuide = memo(function ParadeLoopGuide({ scene }: { scene: SceneId }) {
  const visible = useCollisionDebugVisible()
  const points = useMemo(() => {
    const curve = getParadeLoopCurve()
    return curve.getPoints(SAMPLE_COUNT).map((p): [number, number, number] => [p.x, p.y + 0.1, p.z])
  }, [])

  if (!visible || scene !== 'phase2') return null

  return (
    <group userData={{ editorIgnore: true }}>
      <Line points={points} color={LOOP_COLOR} lineWidth={2} />
    </group>
  )
})
