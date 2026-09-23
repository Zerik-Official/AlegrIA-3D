/**
 * Instanced bank decoration for the arroyo — pebbles and reeds scattered
 * along sampled points on the river's curved edge (see `riverPath`'s
 * `sampleBankEdge`), instead of a straight Z band.
 * @module features/phase1/components/parts/Arroyo/ArroyoBanks
 */

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Generates (once) a tapered reed-blade silhouette with a base-to-tip gradient.
 * @returns Canvas-based reed texture
 */
function useReedTexture(): THREE.Texture {
  return useMemo(() => {
    const w = 16
    const h = 96
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(w * 0.5 - 1.4, h)
    ctx.quadraticCurveTo(w * 0.5 - 2.2, h * 0.35, w * 0.5, 0)
    ctx.quadraticCurveTo(w * 0.5 + 2.2, h * 0.35, w * 0.5 + 1.4, h)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, h, 0, 0)
    gradient.addColorStop(0, '#3a4a1e')
    gradient.addColorStop(0.6, '#5c7a2e')
    gradient.addColorStop(1, '#9cbf5a')
    ctx.fillStyle = gradient
    ctx.fill()
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
}

/** Props for {@link BankRocks}. */
interface BankRocksProps {
  /** Edge points (from `sampleBankEdge`) each rock is jittered around. */
  points: Array<[number, number]>
  /** Ground level the rocks rest on. */
  y: number
}

/**
 * Instanced low-poly pebbles/rocks, one jittered around each sampled edge
 * point, reading as an irregular, natural-looking edge along the curve.
 * @param props - Placement points and ground level
 * @returns Instanced rock mesh
 */
export function BankRocks({ points, y }: BankRocksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.09, 0), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.95 }), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    points.forEach(([x, z], i) => {
      dummy.position.set(x + (Math.random() - 0.5) * 0.5, y + 0.02 + Math.random() * 0.05, z + (Math.random() - 0.5) * 0.5)
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      const s = 0.55 + Math.random() * 1.15
      dummy.scale.set(s, s * 0.7, s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      const tone = 0.35 + Math.random() * 0.35
      color.setRGB(tone * 0.44, tone * 0.4, tone * 0.34)
      mesh.setColorAt(i, color)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [points, y])

  return <instancedMesh ref={meshRef} args={[geometry, material, points.length]} castShadow receiveShadow />
}

/** Props for {@link ReedLine}. */
interface ReedLineProps {
  /** Edge points (from `sampleBankEdge`) each reed is jittered around. */
  points: Array<[number, number]>
}

/**
 * Instanced crossed-plane reeds, one jittered around each sampled edge
 * point, hugging just outside the riverbank along the curve.
 * @param props - Placement points
 * @returns Instanced reed mesh
 */
export function ReedLine({ points }: ReedLineProps) {
  const texture = useReedTexture()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.24, 0.85)
    g.translate(0, 0.425, 0)
    return g
  }, [])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }),
    [texture]
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    points.forEach(([x, z], i) => {
      const s = 0.6 + Math.random() * 0.7
      dummy.position.set(x + (Math.random() - 0.5) * 0.5, 0, z + (Math.random() - 0.5) * 0.5)
      dummy.rotation.set(0, Math.random() * Math.PI, 0)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [points])

  return <instancedMesh ref={meshRef} args={[geometry, material, points.length]} castShadow />
}
