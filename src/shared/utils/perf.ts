/**
 * Lightweight performance utilities for three.js scenes.
 * @module shared/utils/perf
 */

import * as THREE from 'three'

/**
 * Reusable scratch vectors to avoid per-frame allocations in `useFrame` loops.
 * Each caller should use its own namespace to avoid mutation conflicts.
 */
export const scratch = {
  v3a: new THREE.Vector3(),
  v3b: new THREE.Vector3(),
  v3c: new THREE.Vector3(),
  euler: new THREE.Euler(0, 0, 0, 'YXZ'),
  quatA: new THREE.Quaternion(),
  quatB: new THREE.Quaternion(),
}

/**
 * Eases a value with cubic in-out.
 * @param p - Progress in [0,1]
 * @returns Eased progress
 */
export function easeCubicInOut(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

/**
 * Clamps a vector inside axis-aligned bounds without allocating a new vector.
 * @param v - Vector mutated in place
 * @param bounds - Movement bounds
 * @returns The same vector reference
 */
export function clampToBounds(
  v: THREE.Vector3,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
): THREE.Vector3 {
  v.x = THREE.MathUtils.clamp(v.x, bounds.minX, bounds.maxX)
  v.z = THREE.MathUtils.clamp(v.z, bounds.minZ, bounds.maxZ)
  return v
}
