/**
 * The future avenue's sound system: one shared playlist track playing at a
 * time — shuffled, never the same track twice in a row, looping forever once
 * every track has played — heard from either of the avenue's two sound rigs
 * (the parked street jukebox car and the concert stage by RIWI's
 * headquarters), as if they were one extended sound zone. Volume follows the
 * camera's distance to whichever rig is closer, and rises once the narration
 * is over. A track that fails to load or stalls is skipped, so the music
 * never falls silent.
 * @module features/cityIntro/components/carnival/CarnivalMusicSystem
 */

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carnivalPlaylist } from '@/shared/config/audio'
import { registerAudioSource } from '@/shared/audio/audioAnalyser'
import { narrationState } from '@/shared/audio/narrationState'
import { CONCERT_STAGE_XZ, STREET_JUKEBOX_CAR_XZ } from '@/features/cityIntro/config/carnivalLayout'

/** Distance within which the music plays at its full (capped) volume. */
const NEAR_RADIUS = 9
/** Distance beyond which neither rig can be heard. */
const FAR_RADIUS = 30
/** Distance scale of the concert's sound — under `1` so its big rig carries further than the jukebox car. */
const CONCERT_REACH = 0.6
/** Loudest the street music gets while the narrator speaks — under `usePhaseAudio`'s narration volume so it stays a background layer. */
const NARRATION_VOLUME = 0.5
/** Loudest the street music gets once the narration is over, when it's the scene's only soundtrack. */
const FREE_VOLUME = 0.85
/** How quickly the volume cap moves between the two, per second. */
const VOLUME_EASE = 1.5
/** Seconds a track may sit stuck (stalled, or silently stopped) before the next one takes over. */
const STUCK_TIMEOUT_S = 6

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
  const playNextRef = useRef<(() => void) | null>(null)
  /** Watchdog: how long the current track has gone without its playhead moving. */
  const stuckRef = useRef({ lastTime: -1, idle: 0 })
  /** Current volume cap, eased between {@link NARRATION_VOLUME} and {@link FREE_VOLUME}. */
  const capRef = useRef(NARRATION_VOLUME)

  useEffect(() => {
    const el = new Audio()
    el.loop = false
    el.volume = 0
    audioRef.current = el
    registerAudioSource('carnival', el)

    const playNext = (): void => {
      if (queueRef.current.length === 0) {
        const bag = shuffledPlaylist()
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

    playNextRef.current = playNext
    el.addEventListener('ended', playNext)
    el.addEventListener('error', playNext)
    if (carnivalPlaylist.length > 0) playNext()

    return () => {
      el.removeEventListener('ended', playNext)
      el.removeEventListener('error', playNext)
      playNextRef.current = null
      el.pause()
    }
  }, [])

  useFrame(({ camera }, delta) => {
    const el = audioRef.current
    if (!el) return
    const stuck = stuckRef.current
    const progressing = !el.paused && el.currentTime !== stuck.lastTime
    stuck.idle = progressing ? 0 : stuck.idle + delta
    stuck.lastTime = el.currentTime
    if (el.ended || stuck.idle > STUCK_TIMEOUT_S) {
      stuck.idle = 0
      playNextRef.current?.()
    }
    capRef.current = THREE.MathUtils.damp(capRef.current, narrationState.speaking ? NARRATION_VOLUME : FREE_VOLUME, VOLUME_EASE, delta)
    const dCar = Math.hypot(camera.position.x - STREET_JUKEBOX_CAR_XZ[0], camera.position.z - STREET_JUKEBOX_CAR_XZ[1])
    const dConcert = Math.hypot(camera.position.x - CONCERT_STAGE_XZ[0], camera.position.z - CONCERT_STAGE_XZ[1])
    const distance = Math.min(dCar, dConcert * CONCERT_REACH)
    const falloff = 1 - THREE.MathUtils.smoothstep(distance, NEAR_RADIUS, FAR_RADIUS)
    el.volume = THREE.MathUtils.clamp(falloff, 0, 1) * capRef.current
  })

  return null
}
