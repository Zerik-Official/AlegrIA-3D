import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { initialPhase1Entities } from '@/features/editor/config/editableEntities'

/** Circular area other scatter points must avoid. */
interface ExclusionZone {
  x: number
  z: number
  radius: number
}

/** Town ground plane center and half-extents scatter points are drawn from (see `Phase1Scene`'s ground meshes). */
const GROUND_CENTER_X = -12
const GROUND_HALF_X = 67
const GROUND_HALF_Z = 95

/** West-most X the port cluster/Río Magdalena bluff occupies — scatter stays clear of it. */
const RIVER_BAND_X = 50

/**
 * @param x - Candidate X
 * @param z - Candidate Z
 * @param dynamicZones - Exclusion zones derived from `phase1.json` entities
 * @returns Whether the point falls inside the river/port band or an excluded zone
 */
function isExcluded(x: number, z: number, dynamicZones: ExclusionZone[]): boolean {
  if (x > RIVER_BAND_X) return true
  for (const zone of dynamicZones) {
    if ((x - zone.x) ** 2 + (z - zone.z) ** 2 < zone.radius ** 2) return true
  }
  return false
}

/**
 * Rejection-samples scatter points across the ground, avoiding houses,
 * landmarks and the river/port band.
 * @param count - Target number of points
 * @param exclusions - Extra exclusion zones (house/photo/portal/scene/rail footprints)
 * @returns Array of `[x, z]` points
 */
function useScatterPoints(count: number, exclusions: ExclusionZone[]): [number, number][] {
  return useMemo(() => {
    const points: [number, number][] = []
    let attempts = 0
    while (points.length < count && attempts < count * 14) {
      attempts++
      const x = GROUND_CENTER_X + (Math.random() - 0.5) * GROUND_HALF_X * 2
      const z = (Math.random() - 0.5) * GROUND_HALF_Z * 2
      if (isExcluded(x, z, exclusions)) continue
      points.push([x, z])
    }
    return points
  }, [count, exclusions])
}

/**
 * Generates (once) a small tufted-blade silhouette with a base-to-tip
 * gradient, used as a cutout texture for the grass instances.
 * @returns Canvas-based blade texture
 */
function useGrassTexture(): THREE.Texture {
  return useMemo(() => {
    const w = 32
    const h = 64
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    const drawBlade = (cx: number, baseWidth: number, topY: number, from: string, to: string): void => {
      ctx.beginPath()
      ctx.moveTo(cx - baseWidth / 2, h)
      ctx.quadraticCurveTo(cx - baseWidth * 0.15, h * 0.5, cx, topY)
      ctx.quadraticCurveTo(cx + baseWidth * 0.15, h * 0.5, cx + baseWidth / 2, h)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, h, 0, topY)
      grad.addColorStop(0, from)
      grad.addColorStop(1, to)
      ctx.fillStyle = grad
      ctx.fill()
    }

    drawBlade(w * 0.28, 9, 2, '#2f5a1e', '#8fbf4a')
    drawBlade(w * 0.5, 11, 0, '#274d18', '#7cbf3f')
    drawBlade(w * 0.74, 9, 4, '#335f22', '#9ccf55')

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
}

/**
 * Props for {@link GrassField}.
 */
interface GrassFieldProps {
  /** Tuft center points. */
  points: [number, number][]
}

/**
 * Instanced crossed-plane grass tufts (two billboard passes at 90°) with a
 * cutout blade texture. Cheap: two draw calls regardless of tuft count.
 * @param props - Tuft positions
 * @returns Instanced grass meshes
 */
function GrassField({ points }: GrassFieldProps) {
  const texture = useGrassTexture()
  const meshARef = useRef<THREE.InstancedMesh>(null)
  const meshBRef = useRef<THREE.InstancedMesh>(null)

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.62, 0.62)
    g.translate(0, 0.31, 0)
    return g
  }, [])

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 1 }),
    [texture]
  )

  useLayoutEffect(() => {
    const meshA = meshARef.current
    const meshB = meshBRef.current
    if (!meshA || !meshB) return
    const dummy = new THREE.Object3D()
    points.forEach(([x, z], i) => {
      const scale = 0.7 + Math.random() * 0.8
      const rotY = Math.random() * Math.PI
      dummy.position.set(x, 0, z)
      dummy.scale.setScalar(scale)

      dummy.rotation.set(0, rotY, 0)
      dummy.updateMatrix()
      meshA.setMatrixAt(i, dummy.matrix)

      dummy.rotation.set(0, rotY + Math.PI / 2, 0)
      dummy.updateMatrix()
      meshB.setMatrixAt(i, dummy.matrix)
    })
    meshA.instanceMatrix.needsUpdate = true
    meshB.instanceMatrix.needsUpdate = true
  }, [points])

  if (points.length === 0) return null

  return (
    <>
      <instancedMesh ref={meshARef} args={[geometry, material, points.length]} castShadow />
      <instancedMesh ref={meshBRef} args={[geometry, material, points.length]} castShadow />
    </>
  )
}

/**
 * Adds ground-level texture to Phase 1's otherwise-empty dirt plaza: grass
 * tufts scattered around the houses, landmarks and river.
 *
 * @returns Ground detail group
 */
export const GroundDetail = memo(function GroundDetail() {
  const dynamicZones = useMemo<ExclusionZone[]>(
    () =>
      initialPhase1Entities
        .filter((e) => e.type === 'bahareque-house' || e.type === 'sepia-photo' || e.type === 'portal')
        .map((e) => ({
          x: e.position[0],
          z: e.position[2],
          radius: e.type === 'bahareque-house' ? 2.6 : e.type === 'portal' ? 2.4 : 1.6,
        })),
    []
  )
  const grassPoints = useScatterPoints(1900, dynamicZones)

  return (
    <group>
      <GrassField points={grassPoints} />
    </group>
  )
})
