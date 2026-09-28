/**
 * Recognizes the collision proxies Blender exports alongside visible meshes.
 * @module models/shared/collisionMesh
 */

import type * as THREE from 'three'

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