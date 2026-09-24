/**
 * Plays a list of videos in order as a `THREE.VideoTexture`, advancing to the
 * next source when one ends and looping back to the first after the last —
 * muted and autoplaying throughout. Unlike drei's `useVideoTexture` (one
 * source, Suspense-based, loops that single source), this owns its own
 * `<video>` element outside Suspense so the playlist can change at runtime
 * (e.g. the editor adding an entry) without remounting the screen.
 * @module shared/hooks/useVideoPlaylistTexture
 */

import { useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * @param srcs - Ordered, resolved video URLs; empty/undefined plays nothing
 * @returns Live video texture, or `null` while there's nothing to play
 */
export function useVideoPlaylistTexture(srcs: string[] | undefined): THREE.VideoTexture | null {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null)
  /** Joined into the effect's dep key so a changed playlist (editor edit) restarts playback from the first entry. */
  const key = (srcs ?? []).join('|')

  useEffect(() => {
    const list = key ? key.split('|') : []
    if (list.length === 0) {
      setTexture(null)
      return
    }

    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    let index = 0

    const playCurrent = (): void => {
      video.src = list[index % list.length]
      video.currentTime = 0
      video.play().catch(() => {})
    }
    const handleEnded = (): void => {
      index += 1
      playCurrent()
    }
    video.addEventListener('ended', handleEnded)
    playCurrent()

    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.colorSpace = THREE.SRGBColorSpace
    setTexture(videoTexture)

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.pause()
      video.removeAttribute('src')
      video.load()
      videoTexture.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the flattened, comparable form of `srcs`
  }, [key])

  return texture
}

/**
 * Resolves an entity's playlist: `videoSrcs` (when non-empty) takes priority
 * over the single `videoSrc`, so authors can use either field.
 * @param resolvedSrc - `videoSrc` already resolved against the app base URL, or `undefined`
 * @param resolvedSrcs - `videoSrcs` already resolved against the app base URL, or `undefined`
 * @returns The effective playlist, or `undefined` when there's nothing to play
 */
export function resolvePlaylist(resolvedSrc: string | undefined, resolvedSrcs: string[] | undefined): string[] | undefined {
  if (resolvedSrcs && resolvedSrcs.length > 0) return resolvedSrcs
  return resolvedSrc ? [resolvedSrc] : undefined
}
