/**
 * Works out where the editor spawns a new element: at the surface under the
 * editor's crosshair, right below the camera when the crosshair points at
 * nothing, and nowhere (the caller falls back to the map center) when the
 * camera is far from the map.
 * @module features/editor/components/EditorSpawnProbe
 */

import { useEffect, useMemo, type MutableRefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { entityCatalog } from '@/engine/config/entityCatalog'
import type { EditableEntity } from '@/engine/types'

/**
 * Resolves a spawn position for the crosshair at the given client coordinates.
 * Returns `null` when the camera is far from the map.
 */
export type SpawnResolver = (clientX: number, clientY: number) => THREE.Vector3Tuple | null

/**
 * Props for {@link EditorSpawnProbe}.
 */
interface EditorSpawnProbeProps {
  /** Entities of the current scene, which outline the map's extent. */
  entities: EditableEntity[]
  /** Receives the resolver while mounted. */
  resolverRef: MutableRefObject<SpawnResolver | null>
}

/** Farthest surface the crosshair can place on; anything past it counts as looking at nothing. */
const MAX_AIM_DISTANCE = 250
/** Margin around the entities' footprint still considered part of the map. */
const MAP_MARGIN = 30
/** Height the fallback downward ray starts from when nothing lies below the camera. */
const SKY_PROBE_HEIGHT = 1000

/** Entity types living overhead, left out of the map's extent. */
const SKY_TYPES = new Set(entityCatalog.filter((item) => item.placement === 'sky').map((item) => item.type))

/**
 * Whether a raycast hit is a surface something can stand on: a visible
 * mesh, not part of the gizmo, the sky, a glow shell or a debug helper, and
 * not a sky entity.
 * @param object - Hit object
 * @param skyEntityIds - Ids of the scene's sky entities
 * @returns Whether the hit counts
 */
function isPlaceableSurface(object: THREE.Object3D, skyEntityIds: Set<string>): boolean {
  const mesh = object as THREE.Mesh
  if (!mesh.isMesh) return false
  const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).filter(Boolean)
  if (!materials.length || materials.every((material) => material.side === THREE.BackSide || (material.transparent && !material.depthWrite))) return false
  let current: THREE.Object3D | null = object
  while (current) {
    if (!current.visible || current.userData.editorIgnore) return false
    if (current.type.startsWith('TransformControls')) return false
    if (current.name && skyEntityIds.has(current.name)) return false
    current = current.parent
  }
  return true
}

/**
 * Mount inside the canvas while the editor is open.
 * @param props - Scene entities and the resolver ref to fill
 * @returns Null (side-effect only)
 */
export function EditorSpawnProbe({ entities, resolverRef }: EditorSpawnProbeProps) {
  const { camera, scene, gl } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  const extent = useMemo(() => {
    const grounded = entities.filter((e) => !SKY_TYPES.has(e.type))
    if (!grounded.length) return null
    let minX = Infinity
    let maxX = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (const e of grounded) {
      minX = Math.min(minX, e.position[0])
      maxX = Math.max(maxX, e.position[0])
      minZ = Math.min(minZ, e.position[2])
      maxZ = Math.max(maxZ, e.position[2])
    }
    return { minX: minX - MAP_MARGIN, maxX: maxX + MAP_MARGIN, minZ: minZ - MAP_MARGIN, maxZ: maxZ + MAP_MARGIN }
  }, [entities])

  const skyEntityIds = useMemo(() => new Set(entities.filter((e) => SKY_TYPES.has(e.type)).map((e) => e.id)), [entities])

  useEffect(() => {
    /**
     * @param origin - Ray origin
     * @param direction - Normalized ray direction
     * @param far - Maximum distance
     * @returns Placeable hits, nearest first
     */
    const castRay = (origin: THREE.Vector3, direction: THREE.Vector3, far: number): THREE.Intersection[] => {
      raycaster.set(origin, direction)
      raycaster.far = far
      return raycaster.intersectObject(scene, true).filter((hit) => isPlaceableSurface(hit.object, skyEntityIds))
    }

    const resolver: SpawnResolver = (clientX, clientY) => {
      const eye = camera.position
      if (extent && (eye.x < extent.minX || eye.x > extent.maxX || eye.z < extent.minZ || eye.z > extent.maxZ)) return null

      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      const aimHit = castRay(raycaster.ray.origin.clone(), raycaster.ray.direction.clone(), MAX_AIM_DISTANCE)[0]
      if (aimHit) return [aimHit.point.x, aimHit.point.y, aimHit.point.z]

      const down = new THREE.Vector3(0, -1, 0)
      const belowHit = castRay(eye.clone(), down, Infinity)[0]
      if (belowHit) return [eye.x, belowHit.point.y, eye.z]

      const fromSky = castRay(new THREE.Vector3(eye.x, SKY_PROBE_HEIGHT, eye.z), down, Infinity)
      const ground = fromSky[fromSky.length - 1]
      return [eye.x, ground ? ground.point.y : 0, eye.z]
    }

    resolverRef.current = resolver
    return () => {
      if (resolverRef.current === resolver) resolverRef.current = null
    }
  }, [camera, scene, gl, raycaster, extent, skyEntityIds, resolverRef])

  return null
}
