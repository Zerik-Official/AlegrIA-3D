/**
 * Curved centerline for the arroyo — a gentle meander instead of a straight
 * strip — plus helpers to turn it into flat ribbon geometry and to sample
 * offset points along its edge for scattering bank detail (rocks, reeds).
 * @module features/phase1/components/parts/Arroyo/riverPath
 */

import * as THREE from 'three'

/** `[x, z]` control points the river curve interpolates through. */
const CONTROL_POINTS: Array<[number, number]> = [
  [-19, -1.0],
  [-11.5, -0.35],
  [-4, -1.75],
  [3.5, -0.5],
  [11, -1.85],
  [19, -1.15],
]

/**
 * Builds the river's centerline curve. Y is unused here — height comes from
 * whichever tier's ribbon geometry samples this curve at.
 * @returns Centerline curve
 */
export function createRiverCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    'catmullrom',
    0.4
  )
}

/**
 * Flat ribbon geometry of constant `width` following `curve` at height `y`,
 * built directly in world-aligned X/Z (no `rotation-x` needed on the mesh).
 * @param curve - Centerline
 * @param width - Ribbon width, perpendicular to the curve
 * @param y - World Y the ribbon sits at
 * @param segments - Length subdivisions
 * @returns Ribbon geometry
 */
export function buildRibbonGeometry(curve: THREE.CatmullRomCurve3, width: number, y: number, segments = 64): THREE.BufferGeometry {
  const points = curve.getSpacedPoints(segments)
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const half = width / 2

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const point = points[i]
    const tangent = curve.getTangentAt(t)
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
    positions.push(point.x + normal.x * half, y, point.z + normal.z * half)
    positions.push(point.x - normal.x * half, y, point.z - normal.z * half)
    uvs.push(t, 0, t, 1)
    if (i < segments) {
      const a = i * 2
      const b = a + 1
      const c = a + 2
      const d = a + 3
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Points offset `distance` to one `side` of the curve, for scattering bank
 * detail along the river's actual curved edge instead of a straight Z band.
 * @param curve - Centerline
 * @param distance - Perpendicular offset from the centerline
 * @param side - Which side to offset toward
 * @param count - Number of points to sample
 * @returns World-space `[x, z]` points along the offset edge
 */
export function sampleBankEdge(curve: THREE.CatmullRomCurve3, distance: number, side: 1 | -1, count: number): Array<[number, number]> {
  const result: Array<[number, number]> = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
    result.push([point.x + normal.x * distance * side, point.z + normal.z * distance * side])
  }
  return result
}
