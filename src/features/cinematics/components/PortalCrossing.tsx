import { memo } from 'react'
import { PortalCrossingSequence } from '@/features/cinematics/components/PortalCrossingSequence'
import { Wormhole } from '@/features/wormhole/components/Wormhole'
import { TimeVortexParticles } from '@/features/wormhole/components/TimeVortexParticles'

/**
 * Props for {@link PortalCrossing}.
 */
interface PortalCrossingProps {
  /** Whether the crossing is playing. */
  active: boolean
  /** Normalized progress in [0,1] driven by the wormhole timeline. */
  progress: number
  /** World position of the portal being crossed. */
  center: [number, number, number]
  /** Y rotation turning the portal's face (its local `+Z`) towards the player. */
  yaw: number
}

/**
 * Everything drawn while diving through a portal, in whichever scene it
 * stands: the portal waking and blooming (`PortalCrossingSequence`), then the
 * time tunnel and its swirling particles opening out of it.
 *
 * @param props - Crossing state and the portal's placement
 * @returns Crossing group
 */
export const PortalCrossing = memo(function PortalCrossing({ active, progress, center, yaw }: PortalCrossingProps) {
  return (
    <group>
      <PortalCrossingSequence active={active} progress={progress} center={center} yaw={yaw} />
      <Wormhole active={active} progress={progress} center={center} />
      <TimeVortexParticles active={active} progress={progress} center={center} />
    </group>
  )
})
