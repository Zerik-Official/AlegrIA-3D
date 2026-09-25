/**
 * The future avenue's sound system: one shared playlist track playing at a
 * time — shuffled, never the same track twice in a row, looping forever once
 * every track has played — heard from either of the avenue's two sound rigs
 * (the parked street jukebox car and "El Poderoso Premium" by RIWI's
 * building), as if they were one extended sound zone. Volume follows the
 * camera's distance to whichever rig is closer.
 * @module features/cityIntro/components/carnival/CarnivalMusicSystem
 */

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carnivalPlaylist } from '@/shared/config/audio'
import { PODEROSO_PREMIUM_XZ, STREET_JUKEBOX_CAR_XZ } from '@/features/cityIntro/config/carnivalLayout'

/** Distance within which the music plays at its full (capped) volume. */
const NEAR_RADIUS = 9
/** Distance beyond which neither rig can be heard. */
const FAR_RADIUS = 30
/** Loudest the street music ever gets — under `usePhaseAudio`'s narration volume so it stays a background layer. */
const MAX_VOLUME = 0.5

/**
 * @returns A freshly shuffled playlist (Fisher-Yates)
 */
function shuffledPlaylist(): string[] {
  const bag = [...carnivalPlaylist]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

/**
 * Owns the single shared `<audio>` element and drives its shuffled,
 * no-immediate-repeat playback and its distance-based volume. Renders
 * nothing.
 * @returns `null`
 */
export function CarnivalMusicSystem(): null {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<string[]>([])
  const lastTrackRef = useRef<string | null>(null)

  useEffect(() => {
    const el = new Audio()
    el.loop = false
    el.volume = 0
    audioRef.current = el

    const playNext = (): void => {
      if (queueRef.current.length === 0) {
        const bag = shuffledPlaylist()
        // Never let a reshuffle put the just-played track right back up first.
        if (bag.length > 1 && bag[0] === lastTrackRef.current) {
          ;[bag[0], bag[1]] = [bag[1], bag[0]]
        }
        queueRef.current = bag
      }
      const track = queueRef.current.shift()!
      lastTrackRef.current = track
      el.src = track
      el.currentTime = 0
      el.play().catch(() => {})
    }

    el.addEventListener('ended', playNext)
    if (carnivalPlaylist.length > 0) playNext()

    return () => {
      el.removeEventListener('ended', playNext)
      el.pause()
    }
  }, [])

  useFrame(({ camera }) => {
    const el = audioRef.current
    if (!el) return
    const dCar = Math.hypot(camera.position.x - STREET_JUKEBOX_CAR_XZ[0], camera.position.z - STREET_JUKEBOX_CAR_XZ[1])
    const dPoderoso = Math.hypot(camera.position.x - PODEROSO_PREMIUM_XZ[0], camera.position.z - PODEROSO_PREMIUM_XZ[1])
    const distance = Math.min(dCar, dPoderoso)
    const falloff = 1 - THREE.MathUtils.smoothstep(distance, NEAR_RADIUS, FAR_RADIUS)
    el.volume = THREE.MathUtils.clamp(falloff, 0, 1) * MAX_VOLUME
  })

  return null
}
