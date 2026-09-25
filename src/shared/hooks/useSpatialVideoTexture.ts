/**
 * A looping video as a texture whose own soundtrack stays available, for
 * in-world screens that should be heard as well as seen (their volume is
 * then driven by the caller, typically from the listener's distance).
 * @module shared/hooks/useSpatialVideoTexture
 */

import { useEffect, useState } from 'react'
import * as THREE from 'three'

/** A playing video and the texture showing it. */
export interface SpatialVideo {
  texture: THREE.VideoTexture
  video: HTMLVideoElement
}

/**
 * Starts `src` looping — muted at first, as browsers require for autoplay;
 * the caller unmutes it and sets its volume — and wraps it in a texture.
 * Playback stops and the texture is disposed when the source changes or
 * the component unmounts.
 *
 * @param src - Video URL, or `undefined` for none
 * @returns The video and its texture once created, else `null`
 */
export function useSpatialVideoTexture(src: string | undefined): SpatialVideo | null {
  const [state, setState] = useState<SpatialVideo | null>(null)

  useEffect(() => {
    if (!src) {
      setState(null)
      return
    }
    const video = document.createElement('video')
    video.src = src
    video.loop = true
    video.muted = true
    video.volume = 0
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    video.preload = 'auto'
    video.play().catch(() => {})

    const texture = new THREE.VideoTexture(video)
    texture.colorSpace = THREE.SRGBColorSpace
    setState({ texture, video })

    return () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
      texture.dispose()
    }
  }, [src])

  return state
}
