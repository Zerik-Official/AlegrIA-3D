/**
 * Generic glTF model loader with procedural fallback.
 * Handles Blender-authored `.glb` assets gracefully when missing.
 * @module models/shared/ModelLoader
 */

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Props for {@link ModelLoader}.
 */
export interface ModelLoaderProps {
  /** Public URL to the `.glb` asset (e.g. `/models/pedestal/book.glb`). */
  src: string
  /** Fallback rendered when the asset cannot be loaded. */
  fallback: React.ReactNode
  /** Optional scale applied to the loaded scene. */
  scale?: number | [number, number, number]
  /** Optional position. */
  position?: [number, number, number]
  /** Optional rotation in radians. */
  rotation?: [number, number, number]
}

/**
 * Internal glTF scene renderer.
 * Isolated to allow Suspense to work correctly.
 */
function GltfScene({ src, scale, position, rotation }: Omit<ModelLoaderProps, 'fallback'>) {
  const { scene } = useGLTF(src) as unknown as { scene: THREE.Group }

  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
    return c
  }, [scene])

  return <primitive object={cloned} scale={scale ?? 1} position={position} rotation={rotation} />
}

/**
 * Loads a Blender `.glb` with HEAD pre-check and Suspense fallback.
 * Use this to make any domain mesh swappable without touching scene code.
 *
 * @param props - Loader properties
 * @returns Either the loaded glTF or the provided fallback
 * @example
 * ```tsx
 * <ModelLoader src="/models/pedestal/book.glb" fallback={<ProceduralBook />} />
 * ```
 * @link https://github.com/pmndrs/drei#usegltf
 */
export function ModelLoader({ src, fallback, scale, position, rotation }: ModelLoaderProps) {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(src, { method: 'HEAD' })
      .then((r) => {
        if (!cancelled) setAvailable(r.ok)
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [src])

  if (available === false) return <>{fallback}</>
  if (available === null) return <>{fallback}</>

  return (
    <Suspense fallback={fallback}>
      <GltfScene src={src} scale={scale} position={position} rotation={rotation} />
    </Suspense>
  )
}

/**
 * Preloads a model for faster first render.
 * Safe to call even when the asset does not exist.
 * @param src - Model URL
 */
export function preloadModel(src: string): void {
  try {
    useGLTF.preload(src)
  } catch {
    // ignore missing asset
  }
}
