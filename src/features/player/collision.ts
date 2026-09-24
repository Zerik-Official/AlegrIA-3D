/**
 * Shared collision world the player walks against.
 *
 * Each proxy becomes a {@link CollisionSolid}: a world-space AABB plus the
 * plane of its top face, so a tilted box (a staircase slab) reads as a real
 * ramp rather than a wall the height of its bounding box.
 * @module features/player/collision
 */

import * as THREE from 'three'

/**
 * One convex box collider, flattened to what the player resolver needs: an
 * XZ footprint, a vertical span, and the plane of its walkable top face.
 */
export interface CollisionSolid {
  /** World-space AABB footprint. */
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  /** World-space vertical span. */
  minY: number
  maxY: number
  /** A point on the top face, and that face's outward normal — together they define the surface height. */
  topX: number
  topY: number
  topZ: number
  normalX: number
  normalY: number
  normalZ: number
}

/** Below this upward component the top face is too steep to stand on, so the collider reads as a flat-topped wall. */
const MIN_WALKABLE_NORMAL_Y = 0.38

/**
 * Height of `solid`'s top surface directly above `(x, z)`, clamped to the
 * collider's own vertical span so a ramp never reports a height past its ends.
 * @param solid - Collider to sample
 * @param x - World X
 * @param z - World Z
 * @returns Surface height in world units
 */
export function topHeightAt(solid: CollisionSolid, x: number, z: number): number {
  if (solid.normalY < MIN_WALKABLE_NORMAL_Y) return solid.maxY
  const y = solid.topY - (solid.normalX * (x - solid.topX) + solid.normalZ * (z - solid.topZ)) / solid.normalY
  return THREE.MathUtils.clamp(y, solid.minY, solid.maxY)
}

/**
 * @param solid - Collider to test
 * @param x - World X
 * @param z - World Z
 * @param radius - Player's body radius, inflating the footprint
 * @returns Whether `(x, z)` falls within the inflated footprint
 */
function overlapsXZ(solid: CollisionSolid, x: number, z: number, radius: number): boolean {
  return x > solid.minX - radius && x < solid.maxX + radius && z > solid.minZ - radius && z < solid.maxZ + radius
}

/**
 * Pushes `point` out of `solid`'s inflated footprint along whichever axis it
 * has penetrated least, so sliding along a wall feels natural.
 * @param point - Candidate position, mutated in place
 * @param solid - Collider being resolved against
 * @param radius - Player's body radius
 */
function pushOutOfFootprint(point: THREE.Vector3, solid: CollisionSolid, radius: number): void {
  const minX = solid.minX - radius
  const maxX = solid.maxX + radius
  const minZ = solid.minZ - radius
  const maxZ = solid.maxZ + radius
  const toLeft = point.x - minX
  const toRight = maxX - point.x
  const toBack = point.z - minZ
  const toFront = maxZ - point.z
  const smallest = Math.min(toLeft, toRight, toBack, toFront)
  if (smallest === toLeft) point.x = minX
  else if (smallest === toRight) point.x = maxX
  else if (smallest === toBack) point.z = minZ
  else point.z = maxZ
}

/** Tuning for {@link resolveAgainstSolids}. */
export interface CollisionResolveOptions {
  /** Tallest surface the player can walk up onto without stairs. */
  stepUp: number
  /** Player's standing height — colliders whose underside clears it pass overhead instead of blocking. */
  bodyHeight: number
  /** Player's body radius. */
  radius: number
}

/**
 * Resolves a candidate position against the collision world: pushes it out of
 * anything too tall to climb, then reports the height of the highest surface
 * it can stand on there.
 *
 * Runs twice because being pushed out of one collider can change which others
 * the player now overlaps — two passes settle the common case of an inside
 * corner without the cost of a full iterative solver.
 *
 * @param point - Candidate position, mutated in place
 * @param solids - Colliders to resolve against
 * @param currentFloor - Height the player is standing at now, deciding what counts as a step versus a wall
 * @param options - Player body tuning
 * @returns Height of the surface the player ends up standing on (`0` for bare ground)
 */
export function resolveAgainstSolids(
  point: THREE.Vector3,
  solids: readonly CollisionSolid[],
  currentFloor: number,
  options: CollisionResolveOptions
): number {
  const climbLimit = currentFloor + options.stepUp
  const bodyTop = currentFloor + options.bodyHeight
  let floor = 0

  for (let pass = 0; pass < 2; pass++) {
    floor = 0
    for (const solid of solids) {
      if (solid.maxY <= 0.001) continue
      if (!overlapsXZ(solid, point.x, point.z, options.radius)) continue
      const top = topHeightAt(solid, point.x, point.z)
      if (top <= climbLimit) {
        if (top > floor) floor = top
      } else if (solid.minY < bodyTop) {
        pushOutOfFootprint(point, solid, options.radius)
      }
    }
  }

  return floor
}

/** Reusable scratch objects, so extraction never allocates per collider. */
const scratch = {
  box: new THREE.Box3(),
  corner: new THREE.Vector3(),
  min: new THREE.Vector3(),
  max: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  top: new THREE.Vector3(),
  basis: new THREE.Matrix3(),
}

/**
 * Builds a {@link CollisionSolid} from a box-shaped mesh's local bounding box
 * and world matrix — the world AABB from its eight transformed corners, and
 * the top face from the mesh's own local up axis, which is what lets a tilted
 * proxy describe a ramp.
 * @param mesh - Box-shaped collision proxy
 * @returns Collider, or `null` when the mesh has no usable geometry
 */
function solidFromMesh(mesh: THREE.Mesh): CollisionSolid | null {
  const geometry = mesh.geometry
  if (!geometry) return null
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  const local = geometry.boundingBox
  if (!local) return null

  scratch.min.set(Infinity, Infinity, Infinity)
  scratch.max.set(-Infinity, -Infinity, -Infinity)
  for (let i = 0; i < 8; i++) {
    scratch.corner.set(i & 1 ? local.max.x : local.min.x, i & 2 ? local.max.y : local.min.y, i & 4 ? local.max.z : local.min.z)
    scratch.corner.applyMatrix4(mesh.matrixWorld)
    scratch.min.min(scratch.corner)
    scratch.max.max(scratch.corner)
  }

  scratch.basis.setFromMatrix4(mesh.matrixWorld)
  scratch.normal.set(0, 1, 0).applyMatrix3(scratch.basis).normalize()
  if (scratch.normal.y < 0) scratch.normal.negate()

  scratch.top.set((local.min.x + local.max.x) / 2, local.max.y, (local.min.z + local.max.z) / 2).applyMatrix4(mesh.matrixWorld)

  return {
    minX: scratch.min.x,
    maxX: scratch.max.x,
    minZ: scratch.min.z,
    maxZ: scratch.max.z,
    minY: scratch.min.y,
    maxY: scratch.max.y,
    topX: scratch.top.x,
    topY: scratch.top.y,
    topZ: scratch.top.z,
    normalX: scratch.normal.x,
    normalY: scratch.normal.y,
    normalZ: scratch.normal.z,
  }
}

/**
 * Collects every `COL_*` proxy under `root` as a collider, in world space.
 * Call after the object is parented and its ancestors' transforms are set —
 * world matrices are refreshed here, so the caller doesn't have to.
 * @param root - Loaded model root
 * @param isProxy - Predicate identifying collision proxies (see `ModelLoader.isCollisionMesh`)
 * @returns Colliders found, possibly empty
 */
export function extractCollisionSolids(root: THREE.Object3D, isProxy: (mesh: THREE.Mesh) => boolean): CollisionSolid[] {
  root.updateWorldMatrix(true, true)
  const solids: CollisionSolid[] = []
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !isProxy(mesh)) return
    const solid = solidFromMesh(mesh)
    if (solid) solids.push(solid)
  })
  return solids
}

/**
 * Builds a single collider from the overall world bounds of `root`'s visible
 * geometry — the fallback for box-shaped assets that ship no `COL_*` proxies
 * (the bahareque houses). Only worth using on models whose silhouette is close
 * enough to a box that one AABB reads as solid rather than as an invisible
 * wall around thin air.
 * @param root - Loaded model root
 * @param isProxy - Predicate identifying collision proxies, which are excluded from the bounds
 * @returns Collider, or `null` when the model has no visible geometry
 */
export function extractBoundsSolid(root: THREE.Object3D, isProxy: (mesh: THREE.Mesh) => boolean): CollisionSolid | null {
  root.updateWorldMatrix(true, true)
  scratch.box.makeEmpty()
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || isProxy(mesh)) return
    scratch.box.expandByObject(mesh)
  })
  if (scratch.box.isEmpty()) return null
  const { min, max } = scratch.box
  return {
    minX: min.x,
    maxX: max.x,
    minZ: min.z,
    maxZ: max.z,
    minY: min.y,
    maxY: max.y,
    topX: (min.x + max.x) / 2,
    topY: max.y,
    topZ: (min.z + max.z) / 2,
    normalX: 0,
    normalY: 1,
    normalZ: 0,
  }
}

/**
 * Builds a collider for a Y-rotated box authored directly in scene code
 * (library shelving, say) rather than loaded from a `.glb`.
 * @param box - Center, extents and Y rotation of the box
 * @returns Flat-topped collider covering the box's world AABB
 */
export function createBoxSolid(box: {
  x: number
  y: number
  z: number
  sizeX: number
  sizeY: number
  sizeZ: number
  rotationY?: number
}): CollisionSolid {
  const cos = Math.abs(Math.cos(box.rotationY ?? 0))
  const sin = Math.abs(Math.sin(box.rotationY ?? 0))
  const halfX = (box.sizeX * cos + box.sizeZ * sin) / 2
  const halfZ = (box.sizeX * sin + box.sizeZ * cos) / 2
  const top = box.y + box.sizeY / 2
  return {
    minX: box.x - halfX,
    maxX: box.x + halfX,
    minZ: box.z - halfZ,
    maxZ: box.z + halfZ,
    minY: box.y - box.sizeY / 2,
    maxY: top,
    topX: box.x,
    topY: top,
    topZ: box.z,
    normalX: 0,
    normalY: 1,
    normalZ: 0,
  }
}

const groups = new Map<string, CollisionSolid[]>()
let flattened: CollisionSolid[] = []
let stale = false

/**
 * Registers (or replaces) one source's colliders in the shared world.
 * @param id - Stable owner id, typically the entity id
 * @param solids - That owner's colliders
 */
export function registerCollisionSolids(id: string, solids: CollisionSolid[]): void {
  if (solids.length === 0) {
    unregisterCollisionSolids(id)
    return
  }
  groups.set(id, solids)
  stale = true
}

/**
 * Removes one source's colliders — call when its model unmounts, so leaving a
 * scene doesn't leave invisible walls behind in the next one.
 * @param id - Owner id passed to {@link registerCollisionSolids}
 */
export function unregisterCollisionSolids(id: string): void {
  if (groups.delete(id)) stale = true
}

/**
 * @returns Every registered collider, flattened and cached until the world changes
 */
export function getCollisionSolids(): readonly CollisionSolid[] {
  if (stale) {
    flattened = Array.from(groups.values()).flat()
    stale = false
  }
  return flattened
}
