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
  /** Optional scale applied to the loaded scene, on top of any {@link targetSize} normalization. */
  scale?: number | [number, number, number]
  /** Optional position. */
  position?: [number, number, number]
  /** Optional rotation in radians. */
  rotation?: [number, number, number]
  /**
   * When set, the loaded model is uniformly rescaled so its largest bounding-box
   * dimension equals this many scene units, before `scale` is applied on top.
   * Use for third-party `.glb` assets authored at an unknown/inconsistent unit
   * scale, so they land at a size consistent with the rest of the scene
   * regardless of how the source file was modeled.
   */
  targetSize?: number
  /** Whether loaded meshes cast/receive shadows. Disable for small, fast-moving background props where shadow cost isn't worth it. Defaults to `true`. */
  castShadow?: boolean
}

/**
 * Whether a mesh is a Blender-authored collision proxy, not meant to be
 * rendered: the Python export scripts (`.vscode/scripts/*.py`) name these
 * `COL_*` and paint them with a "Colision" placeholder material (flat
 * magenta, `[1, 0, 1, 0.25]`), for a future physics pass rather than display.
 * Filtered out here at load time — the same `.glb` a physics system would
 * later read the `COL_*` nodes from stays visually correct without a re-export.
 * @param mesh - Candidate mesh from a loaded glTF scene graph
 * @returns Whether this mesh should stay hidden
 */
export function isCollisionMesh(mesh: THREE.Mesh): boolean {
  if (mesh.name.startsWith('COL_')) return true
  const material = mesh.material as THREE.Material | THREE.Material[] | undefined
  const materials = Array.isArray(material) ? material : material ? [material] : []
  return materials.some((mat) => mat.name === 'Colision')
}

/**
 * Internal glTF scene renderer.
 * Isolated to allow Suspense to work correctly.
 */
function GltfScene({ src, scale, position, rotation, targetSize, castShadow = true }: Omit<ModelLoaderProps, 'fallback'>) {
  const { scene } = useGLTF(src) as unknown as { scene: THREE.Group }

  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        if (isCollisionMesh(obj as THREE.Mesh)) {
          obj.visible = false
          return
        }
        obj.castShadow = castShadow
        obj.receiveShadow = castShadow
      }
    })
    return c
  }, [scene, castShadow])

  const normalizedScale = useMemo(() => {
    if (!targetSize) return 1
    const size = new THREE.Box3().setFromObject(cloned).getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    return maxDim > 0 ? targetSize / maxDim : 1
  }, [cloned, targetSize])

  const finalScale = useMemo(() => {
    const base = scale ?? 1
    return Array.isArray(base) ? (base.map((v) => v * normalizedScale) as [number, number, number]) : base * normalizedScale
  }, [scale, normalizedScale])

  return <primitive object={cloned} scale={finalScale} position={position} rotation={rotation} />
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
export function ModelLoader({ src, fallback, scale, position, rotation, targetSize, castShadow }: ModelLoaderProps) {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(src, { method: 'HEAD' })
      .then((r) => {
        if (cancelled) return
        const ct = r.headers.get('content-type') ?? ''
        const isHtmlFallback = ct.includes('text/html')
        setAvailable(r.ok && !isHtmlFallback)
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
      <GltfScene src={src} scale={scale} position={position ?? [0, 0, 0]} rotation={rotation ?? [0, 0, 0]} targetSize={targetSize} castShadow={castShadow} />
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
