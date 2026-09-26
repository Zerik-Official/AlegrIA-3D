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
 * @param flipY - Texture `flipY`; `false` for screens UV-mapped the glTF way
 * @returns Live video texture once the first video has loaded, or `null` while there's nothing to play
 */
export function useVideoPlaylistTexture(srcs: string[] | undefined, flipY = true): THREE.VideoTexture | null {
  const [published, setPublished] = useState<{ key: string; texture: THREE.VideoTexture } | null>(null)
  /** Joined into the effect's dep key so a changed playlist (editor edit) restarts playback from the first entry. */
  const key = (srcs ?? []).join('|')

  useEffect(() => {
    const list = key ? key.split('|') : []
    if (list.length === 0) return

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
    videoTexture.flipY = flipY
    const publish = (): void => setPublished({ key, texture: videoTexture })
    video.addEventListener('loadeddata', publish, { once: true })

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadeddata', publish)
      video.pause()
      video.removeAttribute('src')
      video.load()
      videoTexture.dispose()
    }
  }, [key, flipY])

  return key && published?.key === key ? published.texture : null
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
