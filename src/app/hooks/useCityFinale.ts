/**
 * Runs the finale in the future city: the mototaxi ride along the street to
 * the concert by RIWI's headquarters — seen from the passenger seat or from
 * a chase camera — and handing over to free roaming once the player gets off
 * at the end of the ride.
 * @module app/hooks/useCityFinale
 */

import { useCallback, useMemo, useState } from 'react'
import { appConfig } from '@/shared/config/appConfig'
import { useTransientFlag } from '@/shared/hooks/useTransientFlag'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/** How long the farewell title stays up once free roaming begins, in ms. */
const FAREWELL_TITLE_MS = 11000

/** Where the ride's camera sits: the passenger seat or a chase camera behind the mototaxi. */
export type RideView = 'first' | 'third'

/** Finale state derived by {@link useCityFinale}. */
export interface CityFinale {
  /** `path-point` entities the ride follows. */
  walkPath: EditableEntity[]
  /** Feeds the ride's progress along its path, `[0,1]`. */
  setWalkProgress: (progress: number) => void
  /** Whether the mototaxi has reached the end of its route. */
  arrived: boolean
  /** Current ride camera. */
  rideView: RideView
  /** Switches between the passenger seat and the chase camera (`Q`), while riding. */
  toggleRideView: () => void
  /** Gets off the mototaxi (`E`) once it has arrived, handing over to free roaming. */
  dismount: () => void
  /** Whether the player has got off and roams freely. */
  freeRoam: boolean
  /** Whether the farewell title is up. */
  showFarewell: boolean
}

/**
 * @param inCity - Whether the finale is on screen
 * @param entities - The city's entities (the editor's live copy while editing)
 * @returns Finale state
 */
export function useCityFinale(inCity: boolean, entities: EditableEntity[]): CityFinale {
  const [walkProgress, setWalkProgress] = useState(0)
  const [freeRoam, setFreeRoam] = useState(false)
  const [rideView, setRideView] = useState<RideView>('first')
  const walkPath = useMemo(() => entities.filter((e) => e.type === 'path-point'), [entities])
  const arrived = walkProgress >= appConfig.cityIntro.arrivalThreshold

  if (!inCity && (walkProgress !== 0 || freeRoam || rideView !== 'first')) {
    setWalkProgress(0)
    setFreeRoam(false)
    setRideView('first')
  }

  const toggleRideView = useCallback(() => setRideView((view) => (view === 'first' ? 'third' : 'first')), [])

  const dismount = useCallback(() => {
    if (!arrived) return
    setRideView('first')
    setFreeRoam(true)
  }, [arrived])

  const showFarewell = useTransientFlag(freeRoam, FAREWELL_TITLE_MS)

  return { walkPath, setWalkProgress, arrived, rideView, toggleRideView, dismount, freeRoam, showFarewell }
}
