/**
 * Loads a Blender-authored train `.glb`, plays its baked wheel-rotation clips
 * in step with its speed, and runs it along a straight line between two rail
 * tunnels: it comes out of the tunnel behind, brakes to a stop at the
 * station, waits, pulls away into the tunnel ahead, stays out of sight for a
 * while and comes round again. Bypasses the generic `ModelLoader` (which has
 * no animation support) the same way `DancerPerformer`/`ReyMomoPerformer`
 * bypass it for procedural motion.
 * @module features/phase1/components/parts/TrenAnimado
 */

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { isCollisionMesh } from '@/models/shared/collisionMesh'

/**
 * Props for {@link TrenAnimado}. The train runs along its parent's local
 * `+X` axis, the model's front facing that way; the parent's origin is where
 * the model's origin comes to rest at the station.
 */
interface TrenAnimadoProps {
  /** Public URL to the train `.glb`. */
  src: string
  /** Rendered while loading, or when the asset is missing — it follows the same route. */
  fallback: ReactNode
  /** World positions of the rail tunnels' mouths; the nearest behind and ahead of the stop along the line are used. */
  tunnels?: THREE.Vector3Tuple[]
  /** Cruising speed when entering and leaving the tunnels, in scene units/second. */
  speed?: number
  /** Seconds the train waits at the station. */
  dwellSeconds?: number
  /** Seconds the train stays inside the tunnels between runs. */
  hiddenSeconds?: number
}

/** How far inside a tunnel's mouth the train is cut off, so it vanishes in the dark bore rather than at the portal face. */
const CLIP_DEPTH = 2
/** Farthest a tunnel may sit to the side of the line and still count as its end. */
const TUNNEL_LINE_TOLERANCE = 10
/** Line ends used when no tunnel is found behind or ahead of the stop. */
const DEFAULT_ENTRY_X = -60
const DEFAULT_EXIT_X = 45

/** Model extent along its local X: how far its front and rear reach from its origin. */
interface TrainExtents {
  front: number
  rear: number
}

/** Extents of the procedural fallback. */
const FALLBACK_EXTENTS: TrainExtents = { front: 0.5, rear: 3.2 }

/** Reusable scratch objects for the per-frame route math. */
const scratch = {
  local: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  point: new THREE.Vector3(),
}

/**
 * Props for {@link TrenGltf}.
 */
interface TrenGltfProps {
  /** Public URL to the train `.glb`. */
  src: string
  /** Current speed as a fraction of the cruising speed, driving the wheel clips. */
  speedFactorRef: MutableRefObject<number>
  /** Receives the loaded model's extents. */
  extentsRef: MutableRefObject<TrainExtents>
}

/**
 * Internal glTF + animation-mixer renderer, isolated so `Suspense` works.
 * @param props - Model source and shared motion state
 * @returns Train model
 */
function TrenGltf({ src, speedFactorRef, extentsRef }: TrenGltfProps) {
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

  const extents = useMemo<TrainExtents>(() => {
    const box = new THREE.Box3()
    cloned.updateMatrixWorld(true)
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh && mesh.visible) box.expandByObject(mesh)
    })
    return box.isEmpty() ? FALLBACK_EXTENTS : { front: box.max.x, rear: -box.min.x }
  }, [cloned])

  useEffect(() => {
    extentsRef.current = extents
    return () => {
      extentsRef.current = FALLBACK_EXTENTS
    }
  }, [extents, extentsRef])

  const { actions } = useAnimations(animations, modelRef)

  useEffect(() => {
    const playing = Object.values(actions).map((action) => action?.reset().setLoop(THREE.LoopRepeat, Infinity).play())
    return () => {
      playing.forEach((action) => action?.stop())
    }
  }, [actions])

  useFrame(() => {
    for (const action of Object.values(actions)) if (action) action.timeScale = speedFactorRef.current
  })

  return (
    <group ref={modelRef}>
      <primitive object={cloned} />
    </group>
  )
}

/**
 * Finds the line's ends in the train's local frame.
 * @param parent - The train's route frame
 * @param tunnels - World positions of tunnel mouths
 * @returns Local X of the tunnel behind the stop and of the one ahead
 */
function resolveLineEnds(parent: THREE.Object3D, tunnels: THREE.Vector3Tuple[] | undefined): { entryX: number; exitX: number } {
  let entryX = DEFAULT_ENTRY_X
  let exitX = DEFAULT_EXIT_X
  let foundEntry = false
  let foundExit = false
  for (const [x, y, z] of tunnels ?? []) {
    parent.worldToLocal(scratch.local.set(x, y, z))
    if (Math.abs(scratch.local.z) > TUNNEL_LINE_TOLERANCE) continue
    if (scratch.local.x < 0 && (!foundEntry || scratch.local.x > entryX)) {
      entryX = scratch.local.x
      foundEntry = true
    } else if (scratch.local.x > 0 && (!foundExit || scratch.local.x < exitX)) {
      exitX = scratch.local.x
      foundExit = true
    }
  }
  return { entryX, exitX }
}

/**
 * Sets a world-space clipping plane from a plane given in `parent`'s local frame.
 * @param plane - Plane to write
 * @param parent - Frame the local plane is expressed in
 * @param normalX - Local normal's X sign (the plane keeps the side the normal points to)
 * @param x - Local X the plane passes through
 */
function setLocalXPlane(plane: THREE.Plane, parent: THREE.Object3D, normalX: 1 | -1, x: number): void {
  scratch.normal.set(normalX, 0, 0)
  scratch.point.set(x, 0, 0)
  plane.setFromNormalAndCoplanarPoint(scratch.normal, scratch.point).applyMatrix4(parent.matrixWorld)
}

/**
 * Gives every mesh under `root` its own copy of its materials, clipped by
 * `planes` — the copies keep the cached `.glb` materials untouched.
 * @param root - Subtree to clip
 * @param planes - World-space clipping planes
 * @param done - Meshes already clipped
 */
function clipSubtree(root: THREE.Object3D, planes: THREE.Plane[], done: WeakSet<THREE.Object3D>): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || done.has(mesh)) return
    done.add(mesh)
    const clip = (material: THREE.Material): THREE.Material => {
      const copy = material.clone()
      copy.clippingPlanes = planes
      copy.clipShadows = true
      return copy
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clip) : clip(mesh.material)
  })
}

/**
 * Loads a train `.glb` with the same HEAD pre-check/Suspense-fallback contract
 * as `ModelLoader`, and drives whichever of the two is showing along the route.
 *
 * @param props - Loader properties and route timing
 * @returns Route-driven train
 */
export function TrenAnimado({ src, fallback, tunnels, speed = 9, dwellSeconds = 15, hiddenSeconds = 15 }: TrenAnimadoProps) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const motionRef = useRef<THREE.Group>(null)
  const speedFactorRef = useRef(0)
  const extentsRef = useRef<TrainExtents>(FALLBACK_EXTENTS)
  const planes = useMemo(() => [new THREE.Plane(), new THREE.Plane()], [])
  const clipped = useMemo(() => new WeakSet<THREE.Object3D>(), [])

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

  useFrame(({ clock, gl }) => {
    if (!gl.localClippingEnabled) gl.localClippingEnabled = true
    const motion = motionRef.current
    const parent = motion?.parent
    if (!motion || !parent) return
    parent.updateWorldMatrix(true, false)

    const { entryX, exitX } = resolveLineEnds(parent, tunnels)
    const { front, rear } = extentsRef.current
    const arriveDistance = Math.max(0, front + CLIP_DEPTH - entryX)
    const departDistance = Math.max(0, exitX + CLIP_DEPTH + rear)
    const arriveTime = (2 * arriveDistance) / speed
    const departTime = (2 * departDistance) / speed
    const cycle = arriveTime + dwellSeconds + departTime + hiddenSeconds
    let t = THREE.MathUtils.euclideanModulo(clock.elapsedTime, cycle)

    let x = 0
    let speedFactor = 0
    let visible = true
    if (t < arriveTime) {
      const k = t / arriveTime
      x = -arriveDistance * (1 - k) * (1 - k)
      speedFactor = 1 - k
    } else if ((t -= arriveTime) < dwellSeconds) {
      x = 0
    } else if ((t -= dwellSeconds) < departTime) {
      const k = t / departTime
      x = departDistance * k * k
      speedFactor = k
    } else {
      visible = false
    }

    motion.position.x = x
    motion.visible = visible
    speedFactorRef.current = speedFactor

    setLocalXPlane(planes[0], parent, 1, entryX - CLIP_DEPTH)
    setLocalXPlane(planes[1], parent, -1, exitX + CLIP_DEPTH)
    clipSubtree(motion, planes, clipped)
  })

  return (
    <group ref={motionRef}>
      {available === true ? (
        <Suspense fallback={fallback}>
          <TrenGltf src={src} speedFactorRef={speedFactorRef} extentsRef={extentsRef} />
        </Suspense>
      ) : (
        fallback
      )}
    </group>
  )
}
