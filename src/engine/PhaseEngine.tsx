import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getEntityRenderer } from '@/engine/entityRegistry'
import type { EditableEntity, EngineRenderContext } from '@/engine/types'

/**
 * Props for {@link PhaseEngine}.
 */
interface PhaseEngineProps {
  /** Entities for the current phase. */
  entities: EditableEntity[]
  /** Optional render context. */
  context?: EngineRenderContext
  /**
   * Entities farther than this from the camera stop casting shadows (re-enabled when the
   * camera comes back, with 15% hysteresis). Omit to leave shadows untouched.
   */
  shadowDistance?: number
}

/** Seconds between distance checks. */
const SHADOW_CHECK_INTERVAL = 0.4
/** Extra checks (≈ 8 s) after a switch-off that still re-apply it to late-loaded meshes. */
const LATE_LOAD_RECHECKS = 20

/**
 * @param group - Entity wrapper group
 * @param cast - Whether its meshes should cast shadows
 */
function setGroupCastShadow(group: THREE.Object3D, cast: boolean): void {
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) obj.castShadow = cast
  })
}

/**
 * Data-driven engine that decides where, how and with which model to paint each entity.
 * Consumes JSON from `engine/config` or live editor state. Rendering logic per `type` lives
 * in `engine/entityRegistry` — this component only places entities, it never branches on type.
 *
 * @param props - Engine props
 * @returns Engine group
 */
export const PhaseEngine = memo(function PhaseEngine({ entities, context, shadowDistance }: PhaseEngineProps) {
  const rootRef = useRef<THREE.Group>(null)
  const shadowOn = useRef(new WeakMap<THREE.Object3D, { on: boolean; rechecks: number }>())
  const elapsed = useRef(0)
  const world = useRef(new THREE.Vector3())

  useFrame(({ camera }, delta) => {
    if (!shadowDistance || !rootRef.current) return
    elapsed.current += delta
    if (elapsed.current < SHADOW_CHECK_INTERVAL) return
    elapsed.current = 0
    for (const child of rootRef.current.children) {
      const dist = child.getWorldPosition(world.current).distanceTo(camera.position)
      const prev = shadowOn.current.get(child) ?? { on: true, rechecks: 0 }
      const nowOn = prev.on ? dist < shadowDistance * 1.15 : dist < shadowDistance
      const changed = nowOn !== prev.on
      if (changed || (!nowOn && prev.rechecks < LATE_LOAD_RECHECKS)) setGroupCastShadow(child, nowOn)
      shadowOn.current.set(child, { on: nowOn, rechecks: changed ? 0 : prev.rechecks + 1 })
    }
  })

  return (
    <group ref={rootRef}>
      {entities.map((entity) => {
        const Renderer = getEntityRenderer(entity.type)
        return (
          <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
            <Renderer entity={entity} context={context} />
          </group>
        )
      })}
    </group>
  )
})
