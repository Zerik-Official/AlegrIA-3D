/**
 * Loads an image as a small preview texture, for high-resolution scans shown
 * in 3D at a size where their full resolution would only waste GPU memory.
 * @module shared/hooks/useImagePreviewTexture
 */

import { useEffect, useState } from 'react'
import * as THREE from 'three'

/** A loaded preview and the source image's proportions. */
export interface ImagePreview {
  /** Downscaled texture. */
  texture: THREE.Texture
  /** Source width / height. */
  aspect: number
}

/**
 * Decodes `src` and redraws it onto a canvas no larger than `maxEdge` on its
 * longest side, keeping its proportions — a 3000×4300 scan would otherwise
 * take ~50 MB of GPU memory as a texture. The texture is disposed when the
 * source changes or the component unmounts.
 *
 * @param src - Image URL
 * @param maxEdge - Longest side of the preview, in px
 * @returns The preview once loaded, else `null`
 */
export function useImagePreviewTexture(src: string, maxEdge = 640): ImagePreview | null {
  const [preview, setPreview] = useState<ImagePreview | null>(null)

  useEffect(() => {
    let cancelled = false
    let texture: THREE.Texture | null = null
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      setPreview({ texture, aspect: img.naturalWidth / img.naturalHeight })
    }
    img.src = src
    return () => {
      cancelled = true
      texture?.dispose()
      setPreview(null)
    }
  }, [src, maxEdge])

  return preview
}
