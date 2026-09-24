/**
 * Loads a Blender-authored train `.glb` and plays its baked wheel-rotation
 * clips on loop, running it around its rail loop at constant arc-length
 * speed. Bypasses the generic `ModelLoader` (which has no animation support)
 * the same way `DancerPerformer`/`ReyMomoPerformer` bypass it for procedural
 * motion, except here the motion comes from the asset's own glTF
 * `AnimationClip`s via `useAnimations`.
 * @module features/phase1/components/parts/TrenAnimado
 */

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { isCollisionMesh } from '@/models/shared/ModelLoader'

/** Props for {@link TrenAnimado}. */
interface TrenAnimadoProps {
  /** Public URL to the train `.glb`. */
  src: string
  /** Rendered while loading, or when the asset is missing. */
  fallback: ReactNode
  /** Closed-loop rail curve to run around — the model's front faces local +X, matching the rail kit's own `+X`-forward convention. */
  loopCurve: THREE.CatmullRomCurve3
  /** Constant speed along the loop, in scene units/second. */
  speed?: number
  /** `[0, 1)` starting point along the loop. */
  startU?: number
}

/**
 * Internal glTF + animation-mixer renderer, isolated so `Suspense` works.
 */
function TrenGltf({ src, loopCurve, speed = 7, startU = 0 }: Omit<TrenAnimadoProps, 'fallback'>) {
  const { scene, animations } = useGLTF(src) as unknown as { scene: THREE.Group; animations: THREE.AnimationClip[] }
  const modelRef = useRef<THREE.Group>(null)
  const trackRef = useRef<THREE.Group>(null)
  const loopLength = useMemo(() => loopCurve.getLength(), [loopCurve])

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

  const { actions } = useAnimations(animations, modelRef)

  useEffect(() => {
    const playing = Object.values(actions).map((action) => action?.reset().setLoop(THREE.LoopRepeat, Infinity).play())
    return () => {
      playing.forEach((action) => action?.stop())
    }
  }, [actions])

  useFrame(({ clock }) => {
    if (!trackRef.current) return
    const u = THREE.MathUtils.euclideanModulo(startU + (clock.elapsedTime * speed) / loopLength, 1)
    const point = loopCurve.getPointAt(u)
    const tangent = loopCurve.getTangentAt(u)
    trackRef.current.position.set(point.x, point.y, point.z)
    trackRef.current.rotation.y = Math.atan2(tangent.z, tangent.x)
  })

  return (
    <group ref={trackRef}>
      <group ref={modelRef}>
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
export function TrenAnimado({ src, fallback, loopCurve, speed, startU }: TrenAnimadoProps) {
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
      <TrenGltf src={src} loopCurve={loopCurve} speed={speed} startU={startU} />
    </Suspense>
  )
}
