import { memo } from 'react'
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
}

/**
 * Data-driven engine that decides where, how and with which model to paint each entity.
 * Consumes JSON from `engine/config` or live editor state. Rendering logic per `type` lives
 * in `engine/entityRegistry` — this component only places entities, it never branches on type.
 *
 * @param props - Engine props
 * @returns Engine group
 */
export const PhaseEngine = memo(function PhaseEngine({ entities, context }: PhaseEngineProps) {
  return (
    <group>
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
