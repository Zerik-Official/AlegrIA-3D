/**
 * Follows one scene's narration through the shared audio countdown, telling
 * apart this scene's own dialogue from the leftovers of the previous track.
 * @module app/hooks/useNarration
 */

import { useEffect, useState } from 'react'

/** What {@link useNarration} knows about the current scene's narration. */
export interface Narration {
  /** Whether this scene's narration has been heard playing. */
  heard: boolean
  /** Seconds left in this scene's narration once heard, else `null`. */
  remainingSec: number | null
  /** Whether this scene's narration has played through to its end. */
  ended: boolean
}

/**
 * Right after a wormhole, the shared audio countdown still reports the vortex
 * track's final `0` for a moment; only a narration seen actually playing in
 * this scene (a positive countdown) can end, so that leftover is never taken
 * as this scene's dialogue being over.
 *
 * @param active - Whether the scene being followed is on screen
 * @param sceneKey - Identifies the scene, so tracking restarts on every new one
 * @param audioRemainingSec - Shared narration countdown from `usePhaseAudio`
 * @returns Narration state for this scene
 */
export function useNarration(active: boolean, sceneKey: string, audioRemainingSec: number | null): Narration {
  const [tracked, setTracked] = useState({ key: sceneKey, heard: false, ended: false })
  const current = tracked.key === sceneKey && active ? tracked : { key: sceneKey, heard: false, ended: false }

  useEffect(() => {
    if (!active || typeof audioRemainingSec !== 'number') return
    setTracked((prev) => {
      const base = prev.key === sceneKey ? prev : { key: sceneKey, heard: false, ended: false }
      if (audioRemainingSec > 0) return base.heard ? base : { ...base, heard: true }
      return base.heard && !base.ended ? { ...base, ended: true } : base
    })
  }, [active, sceneKey, audioRemainingSec])

  useEffect(() => {
    if (!active) setTracked({ key: sceneKey, heard: false, ended: false })
  }, [active, sceneKey])

  return {
    heard: current.heard,
    remainingSec: current.heard && typeof audioRemainingSec === 'number' ? audioRemainingSec : null,
    ended: current.ended,
  }
}
