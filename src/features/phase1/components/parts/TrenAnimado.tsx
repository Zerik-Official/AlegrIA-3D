/**
 * Loads a Blender-authored train `.glb` and plays its baked wheel-rotation
 * clips on loop, gliding the whole group back and forth along local X so it
 * reads as running its rail line. Bypasses the generic `ModelLoader` (which
 * has no animation support) the same way `DancerPerformer`/`ReyMomoPerformer`
 * bypass it for procedural motion, except here the motion comes from the
 * asset's own glTF `AnimationClip`s via `useAnimations`.
 * @module features/phase1/components/parts/TrenAnimado
 */

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

/** Props for {@link TrenAnimado}. */
interface TrenAnimadoProps {
  /** Public URL to the train `.glb`. */
  src: string
  /** Rendered while loading, or when the asset is missing. */
  fallback: ReactNode
  /** Local-X half-travel distance of the back-and-forth glide; `0` keeps it parked (wheels still spin). */
  range?: number
  /** Seconds for one full out-and-back cycle. */
  periodSeconds?: number
  /** Uniform rescale so the model's largest bounding-box dimension equals this many scene units. */
  targetSize?: number
}

/**
 * Internal glTF + animation-mixer renderer, isolated so `Suspense` works.
 */
function TrenGltf({ src, range = 0, periodSeconds = 40, targetSize }: Omit<TrenAnimadoProps, 'fallback'>) {
  const { scene, animations } = useGLTF(src) as unknown as { scene: THREE.Group; animations: THREE.AnimationClip[] }
  const modelRef = useRef<THREE.Group>(null)
  const glideRef = useRef<THREE.Group>(null)

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

  const { actions } = useAnimations(animations, modelRef)

  useEffect(() => {
    const playing = Object.values(actions).map((action) => action?.reset().setLoop(THREE.LoopRepeat, Infinity).play())
    return () => {
      playing.forEach((action) => action?.stop())
    }
  }, [actions])

  const normalizedScale = useMemo(() => {
    if (!targetSize) return 1
    const size = new THREE.Box3().setFromObject(cloned).getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    return maxDim > 0 ? targetSize / maxDim : 1
  }, [cloned, targetSize])

  useFrame(({ clock }) => {
    if (!glideRef.current || !range) return
    glideRef.current.position.x = Math.sin((clock.elapsedTime * Math.PI * 2) / periodSeconds) * range
  })

  return (
    <group ref={glideRef}>
      <group ref={modelRef} scale={normalizedScale}>
        <primitive object={cloned} />
      </group>
    </group>
  )
}

/**
 * Loads a train `.glb` with the same HEAD pre-check/Suspense-fallback contract
 * as `ModelLoader`, but through its own animated renderer since baked clips
 * need an `AnimationMixer` rather than `ModelLoader`'s static `<primitive>`.
 *
 * @param props - Loader properties
 * @returns Either the animated train or the provided fallback
 */
export function TrenAnimado({ src, fallback, range, periodSeconds, targetSize }: TrenAnimadoProps) {
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
      <TrenGltf src={src} range={range} periodSeconds={periodSeconds} targetSize={targetSize} />
    </Suspense>
  )
}
