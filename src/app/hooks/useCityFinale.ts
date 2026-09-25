/**
 * Runs the finale in the future city: the scripted walk up the street, and
 * handing over to free roaming once the narration is over and the walk has
 * reached the library.
 * @module app/hooks/useCityFinale
 */

import { useEffect, useMemo, useState } from 'react'
import { appConfig } from '@/shared/config/appConfig'
import { useTransientFlag } from '@/shared/hooks/useTransientFlag'
import type { EditableEntity } from '@/features/editor/config/editableEntities'
import type { Narration } from '@/app/hooks/useNarration'

/** How long the farewell title stays up once free roaming begins, in ms. */
const FAREWELL_TITLE_MS = 11000

/** Finale state derived by {@link useCityFinale}. */
export interface CityFinale {
  /** `path-point` entities the scripted walk follows. */
  walkPath: EditableEntity[]
  /** Feeds the walk's progress along its path, `[0,1]`. */
  setWalkProgress: (progress: number) => void
  /** Whether the walk has handed over to free roaming. */
  freeRoam: boolean
  /** Whether the farewell title is up. */
  showFarewell: boolean
}

/**
 * @param inCity - Whether the finale is on screen
 * @param entities - The city's entities (the editor's live copy while editing)
 * @param narration - The finale's narration, as followed by `useNarration`
 * @returns Finale state
 */
export function useCityFinale(inCity: boolean, entities: EditableEntity[], narration: Narration): CityFinale {
  const [walkProgress, setWalkProgress] = useState(0)
  const [freeRoam, setFreeRoam] = useState(false)
  const walkPath = useMemo(() => entities.filter((e) => e.type === 'path-point'), [entities])
  const arrived = walkProgress >= appConfig.cityIntro.arrivalThreshold

  useEffect(() => {
    if (inCity) return
    setWalkProgress(0)
    setFreeRoam(false)
  }, [inCity])

  useEffect(() => {
    if (inCity && arrived && narration.ended) setFreeRoam(true)
  }, [inCity, arrived, narration.ended])

  const showFarewell = useTransientFlag(freeRoam, FAREWELL_TITLE_MS)

  return { walkPath, setWalkProgress, freeRoam, showFarewell }
}
