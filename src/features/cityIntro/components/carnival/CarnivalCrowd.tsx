import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  beatAt,
  CARNIVAL_CLOTHES,
  CARNIVAL_SKIN,
  CROWD_BLOCKING_BOXES,
  CROWD_BLOCKING_CIRCLES,
  CROWD_COUNT,
  PARTY_AREA,
  WALK_CLEARANCE,
} from '@/features/cityIntro/config/carnivalLayout'
import type { EditableEntity } from '@/features/editor/config/editableEntities'
import { createSeededRandom } from '@/shared/utils/random'
import { MOTOTAXI_CLEAR_RADIUS, mototaxiState } from '@/features/cityIntro/state/mototaxiState'

/** Deterministic random source for this module's procedural layout, so render stays pure. */
const seededRandom = createSeededRandom(51587)

/**
 * Props for {@link CarnivalCrowd}.
 */
interface CarnivalCrowdProps {
  /** The walk's `path-point` entities — the crowd leaves a corridor along the path they trace. */
  pathEntities: EditableEntity[]
}

/** One dancer. */
interface Dancer {
  x: number
  z: number
  scale: number
  phase: number
  hasArm: boolean
  armSide: number
  sway: number
  rotation: number
}

/** Radius within which dancers step aside for the player. */
const MAKE_WAY_RADIUS = 1.5
/**
 * Frustum margin (world units) added around the camera's view before a
 * dancer is considered "on screen" — keeps hop/sway animation from visibly
 * starting/stopping right at the screen edge.
 */
const FRUSTUM_MARGIN = 6

/**
 * @param entities - `path-point` entities
 * @returns The walk's X at a given Z (sampled from the same Catmull-Rom curve `MototaxiRide` follows), or `null` beyond the path
 */
function pathXAt(entities: EditableEntity[]): (z: number) => number | null {
  const sorted = [...entities].sort((a, b) => (parseFloat(a.variant ?? '0') || 0) - (parseFloat(b.variant ?? '0') || 0))
  if (sorted.length < 2) return () => null
  const curve = new THREE.CatmullRomCurve3(
    sorted.map((e) => new THREE.Vector3(e.position[0], 0, e.position[2])),
    false,
    'catmullrom',
    0.3
  )
  const samples = curve.getSpacedPoints(240)
  return (z) => {
    let best: THREE.Vector3 | null = null
    for (const p of samples) if (!best || Math.abs(p.z - z) < Math.abs(best.z - z)) best = p
    return best && Math.abs(best.z - z) < 1.5 ? best.x : null
  }
}

/**
 * @param x - Candidate X
 * @param z - Candidate Z
 * @param walkX - Walk path's X at `z`, if it passes there
 * @returns Whether a dancer may stand at `(x, z)`
 */
function isFreeSpot(x: number, z: number, walkX: number | null): boolean {
  if (walkX !== null && Math.abs(x - walkX) < WALK_CLEARANCE) return false
  for (const [minX, maxX, minZ, maxZ] of CROWD_BLOCKING_BOXES) if (x > minX && x < maxX && z > minZ && z < maxZ) return false
  for (const c of CROWD_BLOCKING_CIRCLES) if (Math.hypot(x - c.x, z - c.z) < c.radius) return false
  return true
}

/** Reused transform scratch so the dance allocates nothing per frame. */
const scratch = {
  matrix: new THREE.Matrix4(),
  quat: new THREE.Quaternion(),
  euler: new THREE.Euler(),
  scale: new THREE.Vector3(),
  pos: new THREE.Vector3(),
  color: new THREE.Color(),
}

/**
 * Writes one dancer's body/head/arm matrices for a given beat — factored out
 * so both the initial (resting-pose) layout and the per-frame animation of
 * on-screen dancers share the exact same pose math.
 * @param i - Instance index
 * @param d - Dancer
 * @param beat - Beats elapsed (0 for the initial static pose)
 * @param px - Player/camera X, for the step-aside push
 * @param pz - Player/camera Z, for the step-aside push
 * @param ox - Current X offset of the dancer's make-way for the mototaxi
 * @param oz - Current Z offset of the dancer's make-way for the mototaxi
 * @param body - Body instanced mesh
 * @param head - Head instanced mesh
 * @param arm - Arm instanced mesh
 */
function poseDancer(
  i: number,
  d: Dancer,
  beat: number,
  px: number,
  pz: number,
  ox: number,
  oz: number,
  body: THREE.InstancedMesh,
  head: THREE.InstancedMesh,
  arm: THREE.InstancedMesh
): void {
  let x = d.x + ox
  let z = d.z + oz
  const dx = x - px
  const dz = z - pz
  const dist = Math.hypot(dx, dz)
  if (dist < MAKE_WAY_RADIUS && dist > 0.001) {
    const push = (MAKE_WAY_RADIUS - dist) * 0.9
    x += (dx / dist) * push
    z += (dz / dist) * push
  }
  const hop = Math.abs(Math.sin(beat * Math.PI + d.phase)) * 0.13 * d.scale
  const sway = Math.sin(beat * Math.PI * 0.5 + d.phase) * d.sway

  scratch.euler.set(0, d.rotation, sway)
  scratch.quat.setFromEuler(scratch.euler)
  scratch.scale.setScalar(d.scale)
  scratch.pos.set(x, 0.6 * d.scale + hop + 0.18, z)
  scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale)
  body.setMatrixAt(i, scratch.matrix)

  scratch.pos.set(x - Math.sin(sway) * 0.18 * d.scale, 1.28 * d.scale + hop + 0.18, z)
  scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale)
  head.setMatrixAt(i, scratch.matrix)

  if (d.hasArm) {
    const wave = Math.sin(beat * Math.PI + d.phase) * 0.35
    scratch.euler.set(0, d.rotation, d.armSide * (0.35 + wave))
    scratch.quat.setFromEuler(scratch.euler)
    const ox = Math.cos(d.rotation) * 0.24 * d.armSide
    const oz = -Math.sin(d.rotation) * 0.24 * d.armSide
    scratch.pos.set(x + ox, 1.35 * d.scale + hop + 0.18, z + oz)
    scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale)
  } else {
    scratch.matrix.makeScale(0, 0, 0)
  }
  arm.setMatrixAt(i, scratch.matrix)
}

/**
 * The street party's crowd: hundreds of dancers in carnival colors filling
 * the avenue, hopping and swaying on the beat, some with an arm up. They
 * leave a corridor along the walk's path, keep off the trees, slabs, bus and
 * stalls, and step aside when the player walks among them — or ease out of
 * the mototaxi's way as it rolls through, drifting back once it has passed.
 *
 * @param props - Walk path
 * @returns Instanced crowd
 */
export const CarnivalCrowd = memo(function CarnivalCrowd({ pathEntities }: CarnivalCrowdProps) {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const armRef = useRef<THREE.InstancedMesh>(null)
  const geometries = useMemo(
    () => ({
      body: new THREE.CapsuleGeometry(0.21, 0.78, 4, 8),
      head: new THREE.SphereGeometry(0.15, 10, 8),
      arm: new THREE.CapsuleGeometry(0.05, 0.55, 2, 6),
    }),
    []
  )
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 }), [])
  /** Per-dancer `[x, z]` make-way offsets for the mototaxi, eased in as it nears and back out once it has passed. */
  const offsetsRef = useRef<Float32Array>(new Float32Array(0))
  const frustum = useMemo(() => new THREE.Frustum(), [])
  const frustumMatrix = useMemo(() => new THREE.Matrix4(), [])
  const testSphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), FRUSTUM_MARGIN), [])

  const dancers = useMemo(() => {
    const walkX = pathXAt(pathEntities)
    const [minX, maxX, minZ, maxZ] = PARTY_AREA
    const list: Dancer[] = []
    let attempts = 0
    while (list.length < CROWD_COUNT && attempts < CROWD_COUNT * 12) {
      attempts++
      const x = minX + seededRandom() * (maxX - minX)
      const z = minZ + seededRandom() * (maxZ - minZ)
      if (!isFreeSpot(x, z, walkX(z))) continue
      list.push({
        x,
        z,
        scale: 0.88 + seededRandom() * 0.24,
        phase: seededRandom() * Math.PI * 2,
        hasArm: seededRandom() < 0.35,
        armSide: seededRandom() < 0.5 ? -1 : 1,
        sway: 0.04 + seededRandom() * 0.1,
        rotation: seededRandom() * Math.PI * 2,
      })
    }
    return list
  }, [pathEntities])

  useLayoutEffect(() => {
    const body = bodyRef.current
    const head = headRef.current
    const arm = armRef.current
    if (!body || !head || !arm) return
    dancers.forEach((d, i) => {
      const clothes = scratch.color.set(CARNIVAL_CLOTHES[Math.floor(Math.random() * CARNIVAL_CLOTHES.length)])
      body.setColorAt(i, clothes)
      arm.setColorAt(i, clothes)
      head.setColorAt(i, scratch.color.set(CARNIVAL_SKIN[Math.floor(Math.random() * CARNIVAL_SKIN.length)]))
      poseDancer(i, d, 0, Infinity, Infinity, 0, 0, body, head, arm)
    })
    for (const mesh of [body, head, arm]) {
      mesh.count = dancers.length
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.instanceMatrix.needsUpdate = true
    }
    const bodyMaterial = body.material as THREE.Material
    bodyMaterial.needsUpdate = true
  }, [dancers])

  useFrame(({ clock, camera }, delta) => {
    const body = bodyRef.current
    const head = headRef.current
    const arm = armRef.current
    if (!body || !head || !arm) return
    const { beat } = beatAt(clock.elapsedTime)

    frustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(frustumMatrix)

    const riding = mototaxiState.active
    const moto = mototaxiState.position
    const px = riding ? Infinity : camera.position.x
    const pz = riding ? Infinity : camera.position.z
    const ease = Math.min(1, delta * 3)
    const offsets = offsetsRef.current.length === dancers.length * 2 ? offsetsRef.current : (offsetsRef.current = new Float32Array(dancers.length * 2))

    let touched = false
    for (let i = 0; i < dancers.length; i++) {
      const d = dancers[i]
      let tx = 0
      let tz = 0
      if (riding) {
        const dx = d.x - moto.x
        const dz = d.z - moto.z
        const dist = Math.hypot(dx, dz)
        if (dist < MOTOTAXI_CLEAR_RADIUS && dist > 0.001) {
          const push = MOTOTAXI_CLEAR_RADIUS - dist + 0.4
          tx = (dx / dist) * push
          tz = (dz / dist) * push
        }
      }
      offsets[i * 2] += (tx - offsets[i * 2]) * ease
      offsets[i * 2 + 1] += (tz - offsets[i * 2 + 1]) * ease
      testSphere.center.set(d.x + offsets[i * 2], 1, d.z + offsets[i * 2 + 1])
      if (!frustum.intersectsSphere(testSphere)) continue
      poseDancer(i, d, beat, px, pz, offsets[i * 2], offsets[i * 2 + 1], body, head, arm)
      touched = true
    }
    if (touched) {
      body.instanceMatrix.needsUpdate = true
      head.instanceMatrix.needsUpdate = true
      arm.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[geometries.body, material, CROWD_COUNT]} castShadow frustumCulled={false} />
      <instancedMesh ref={headRef} args={[geometries.head, material, CROWD_COUNT]} frustumCulled={false} />
      <instancedMesh ref={armRef} args={[geometries.arm, material, CROWD_COUNT]} frustumCulled={false} />
    </group>
  )
})
