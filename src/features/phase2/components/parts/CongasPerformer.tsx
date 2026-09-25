/**
 * Loads the "congas" character `.glb` and plays its baked dance-loop
 * animation clip in place. Bypasses the generic `ModelLoader` (which has no
 * animation support) the same way `TrenAnimado` does for the train, since
 * this asset's motion comes from its own glTF `AnimationClip`s via
 * `useAnimations` rather than a procedural driver.
 * @module features/phase2/components/parts/CongasPerformer
 */

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { isCollisionMesh } from '@/models/shared/ModelLoader'

/** Props for {@link CongasPerformer}. */
interface CongasPerformerProps {
  /** Public URL to the character's `.glb`. */
  src: string
  /** Rendered while loading, or when the asset is missing. */
  fallback: ReactNode
  /**
   * When set, the loaded model is uniformly rescaled so its largest
   * bounding-box dimension equals this many scene units — same normalization
   * `ModelLoader`'s `targetSize` does, for third-party `.glb`s (e.g. a
   * Sketchfab export) authored at an unknown/inconsistent unit scale.
   */
  targetSize?: number
}

/**
 * Internal glTF + animation-mixer renderer, isolated so `Suspense` works.
 */
function CongasGltf({ src, targetSize }: Omit<CongasPerformerProps, 'fallback'>) {
  const { scene, animations } = useGLTF(src) as unknown as { scene: THREE.Group; animations: THREE.AnimationClip[] }
  const modelRef = useRef<THREE.Group>(null)

  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        if (isCollisionMesh(obj as THREE.Mesh)) {
          obj.visible = false
          return
        }
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
    return c
  }, [scene])

  const normalizedScale = useMemo(() => {
    if (!targetSize) return 1
    const size = new THREE.Box3().setFromObject(cloned).getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    return maxDim > 0 ? targetSize / maxDim : 1
  }, [cloned, targetSize])

  const { actions } = useAnimations(animations, modelRef)

  useEffect(() => {
    const playing = Object.values(actions).map((action) => action?.reset().setLoop(THREE.LoopRepeat, Infinity).play())
    return () => {
      playing.forEach((action) => action?.stop())
    }
  }, [actions])

  return (
    <group ref={modelRef} scale={normalizedScale}>
      <primitive object={cloned} />
    </group>
  )
}

/**
 * Loads the congas character `.glb` with the same HEAD pre-check/Suspense-fallback
 * contract as `ModelLoader`, but through its own animated renderer since the
 * baked clip needs an `AnimationMixer` rather than `ModelLoader`'s static `<primitive>`.
 *
 * @param props - Loader properties
 * @returns Either the animated character or the provided fallback
 */
export function CongasPerformer({ src, fallback, targetSize }: CongasPerformerProps) {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(src, { method: 'HEAD' })
      .then((r) => {
        if (cancelled) return
        const ct = r.headers.get('content-type') ?? ''
        setAvailable(r.ok && !ct.includes('text/html'))
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [src])

  if (available !== true) return <>{fallback}</>

  return (
    <Suspense fallback={fallback}>
      <CongasGltf src={src} targetSize={targetSize} />
    </Suspense>
  )
}
