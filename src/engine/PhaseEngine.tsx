import { memo } from 'react'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { BaharequeHouse } from '@/features/phase1/components/parts/BaharequeHouse'
import { SepiaPhotoFrame } from '@/features/phase1/components/parts/SepiaPhotoFrame'
import { ProceduralPortal, ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { CyberWall } from '@/features/library/components/CyberWall'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { Pedestal } from '@/features/pedestal/components/Pedestal'
import { LevitatingBook } from '@/features/pedestal/components/LevitatingBook'
import type { EditableEntity } from '@/features/editor/config/editableEntities'
import type { EngineRenderContext } from '@/engine/types'

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
 * Consumes JSON from `engine/config` or live editor state.
 *
 * @param props - Engine props
 * @returns Engine group
 */
export const PhaseEngine = memo(function PhaseEngine({ entities, context }: PhaseEngineProps) {
  return (
    <group>
      {entities.map((entity) => {
        if (entity.type === 'bahareque-house') {
          const variant = (entity.variant as 'short' | 'medium' | 'long') ?? 'medium'
          const key = `phase1/bahareque-house-${variant}` as keyof typeof modelRegistry
          const path = modelRegistry[key]?.path ?? modelRegistry['phase1/bahareque-house'].path
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <ModelLoader src={path} fallback={<BaharequeHouse position={[0, 0, 0]} rotationY={0} variant={variant} scale={1} />} />
            </group>
          )
        }
        if (entity.type === 'sepia-photo') {
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <ModelLoader
                src={modelRegistry['phase1/sepia-photo'].path}
                fallback={
                  <SepiaPhotoFrame
                    position={[0, 0, 0]}
                    rotationY={0}
                    imageIndex={0}
                    highlighted={context?.highlightedPhotoId === entity.id}
                  />
                }
              />
            </group>
          )
        }
        if (entity.type === 'portal') {
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <ProceduralPortal position={[0, 0, 0]} radius={1.55} />
            </group>
          )
        }
        if (entity.type === 'cyber-wall') {
          const variant = entity.variant ?? '22x5.2'
          const size: [number, number, number] = variant === '22x5.2' ? [22, 5.2, 0.45] : [22, 5.2, 0.45]
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <CyberWall position={[0, 0, 0]} size={size} />
            </group>
          )
        }
        if (entity.type === 'bookshelf') {
          const width = entity.variant ? parseFloat(entity.variant) : 5.2
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <Bookshelf position={[0, 0, 0]} width={width} />
            </group>
          )
        }
        if (entity.type === 'pedestal') {
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <Pedestal />
            </group>
          )
        }
        if (entity.type === 'book') {
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <LevitatingBook ritualProgress={context?.ritualProgress} />
            </group>
          )
        }
        if (entity.type === 'facade') {
          const color = entity.variant ?? '#e85a3a'
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[3.2, 2.2, 1.9]} />
                <meshStandardMaterial color={color} roughness={0.88} />
              </mesh>
            </group>
          )
        }
        if (entity.type === 'temple') {
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <mesh castShadow>
                <boxGeometry args={[4.2, 3.3, 2.0]} />
                <meshStandardMaterial color="#1a1a1e" roughness={0.98} />
              </mesh>
            </group>
          )
        }
        if (entity.type === 'trinitaria') {
          const bloom = entity.variant ?? '#d82a7a'
          return (
            <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
              <ProceduralTrinitaria position={[0, 0, 0]} bloomColor={bloom} />
            </group>
          )
        }
        return (
          <group key={entity.id} name={entity.id} position={entity.position} rotation-y={entity.rotationY} scale={entity.scale}>
            <mesh>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color="#ff3b1f" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
})
