/**
 * Curved centerline for the arroyo — a gentle meander instead of a straight
 * strip — plus a cross-section "loft" builder (sweep a profile of
 * `{offset, y}` points along the curve) so the banks slope continuously
 * down to the surrounding ground with no gap/floating-platform seam, and a
 * helper to sample offset points along the curve for scattering bank detail
 * (rocks, reeds).
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
 * whichever loft profile samples this curve.
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

/** One cross-section station: perpendicular distance from the centerline (signed) and world Y there. */
export interface CrossSectionPoint {
  offset: number
  y: number
}

/**
 * Sweeps a cross-section `profile` along `curve`, producing one continuous
 * mesh — adjacent profile stations share exact edge vertices at every
 * length step, so a profile that starts at `y=0` (matching the surrounding
 * ground) and rises to a bank crest has no gap or floating-platform seam at
 * its outer edge.
 * @param curve - Centerline
 * @param profile - Ordered cross-section stations, e.g. ground → bank crest → water edge
 * @param segments - Length subdivisions
 * @returns Loft geometry
 */
export function buildLoftGeometry(curve: THREE.CatmullRomCurve3, profile: CrossSectionPoint[], segments = 64): THREE.BufferGeometry {
  const centerPoints = curve.getSpacedPoints(segments)
  const rows = profile.length
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const center = centerPoints[i]
    const tangent = curve.getTangentAt(t)
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
    for (let r = 0; r < rows; r++) {
      const { offset, y } = profile[r]
      positions.push(center.x + normal.x * offset, y, center.z + normal.z * offset)
      uvs.push(t, rows > 1 ? r / (rows - 1) : 0)
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let r = 0; r < rows - 1; r++) {
      const a = i * rows + r
      const b = a + 1
      const c = (i + 1) * rows + r
      const d = c + 1
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
