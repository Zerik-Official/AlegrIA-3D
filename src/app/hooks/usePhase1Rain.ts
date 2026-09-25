/**
 * Decides when it rains over Phase 1 — from a set point near the end of its
 * narration until the player leaves — and plays the rain's ambience.
 * @module app/hooks/usePhase1Rain
 */

import { useEffect, useState } from 'react'
import { appConfig } from '@/shared/config/appConfig'
import { useRainAudio } from '@/app/hooks/useRainAudio'
import type { Narration } from '@/app/hooks/useNarration'

/**
 * @param inPhase1 - Whether Phase 1's scene is on screen
 * @param narration - Phase 1's narration, as followed by `useNarration`
 * @returns Whether it's raining
 */
export function usePhase1Rain(inPhase1: boolean, narration: Narration): boolean {
  const [raining, setRaining] = useState(false)
  const nearEnd = narration.remainingSec !== null && narration.remainingSec <= appConfig.rain.startAtRemainingSec

  useEffect(() => {
    if (!inPhase1) setRaining(false)
    else if (nearEnd || narration.ended) setRaining(true)
  }, [inPhase1, nearEnd, narration.ended])

  useRainAudio(raining)
  return raining
}
