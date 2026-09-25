/**
 * A small knot of dancers around a fixed sound system — the same instanced
 * hop/sway crowd as {@link CarnivalCrowd}, scaled down and placed in local
 * space so it can be dropped inside any entity renderer (e.g. "El Poderoso
 * Premium", parked off the main avenue where the avenue's own crowd doesn't
 * reach).
 * @module features/cityIntro/components/carnival/LocalDanceCrowd
 */

import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { beatAt, CARNIVAL_CLOTHES, CARNIVAL_SKIN } from '@/features/cityIntro/config/carnivalLayout'

/** Props for {@link LocalDanceCrowd}. */
interface LocalDanceCrowdProps {
  /** How many dancers. */
  count: number
  /** Outer radius (local space, around the origin) they scatter within. */
  radius: number
  /** Inner radius kept clear, so nobody spawns inside the sound rig itself. */
  exclude: number
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

/** Reused transform scratch. */
const scratch = {
  matrix: new THREE.Matrix4(),
  quat: new THREE.Quaternion(),
  euler: new THREE.Euler(),
  scale: new THREE.Vector3(),
  pos: new THREE.Vector3(),
  color: new THREE.Color(),
}

/**
 * @param count - How many dancers to scatter
 * @param radius - Outer spawn radius
 * @param exclude - Inner clear radius
 * @returns Dancer list
 */
function buildDancers(count: number, radius: number, exclude: number): Dancer[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const r = exclude + Math.random() * (radius - exclude)
    return {
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      scale: 0.88 + Math.random() * 0.24,
      phase: Math.random() * Math.PI * 2,
      hasArm: Math.random() < 0.35,
      armSide: Math.random() < 0.5 ? -1 : 1,
      sway: 0.04 + Math.random() * 0.1,
      rotation: Math.random() * Math.PI * 2,
    }
  })
}

/**
 * A small crowd dancing on the beat around a fixed point in local space.
 * @param props - Count and spawn radii
 * @returns Instanced crowd
 */
export const LocalDanceCrowd = memo(function LocalDanceCrowd({ count, radius, exclude }: LocalDanceCrowdProps) {
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
  const dancers = useMemo(() => buildDancers(count, radius, exclude), [count, radius, exclude])

  useLayoutEffect(() => {
    const body = bodyRef.current
    const head = headRef.current
    const arm = armRef.current
    if (!body || !head || !arm) return
    dancers.forEach((_, i) => {
      const clothes = scratch.color.set(CARNIVAL_CLOTHES[Math.floor(Math.random() * CARNIVAL_CLOTHES.length)])
      body.setColorAt(i, clothes)
      arm.setColorAt(i, clothes)
      head.setColorAt(i, scratch.color.set(CARNIVAL_SKIN[Math.floor(Math.random() * CARNIVAL_SKIN.length)]))
    })
    for (const mesh of [body, head, arm]) {
      mesh.count = dancers.length
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    material.needsUpdate = true
  }, [dancers, material])

  useFrame(({ clock }) => {
    const body = bodyRef.current
    const head = headRef.current
    const arm = armRef.current
    if (!body || !head || !arm) return
    const { beat } = beatAt(clock.elapsedTime)
    for (let i = 0; i < dancers.length; i++) {
      const d = dancers[i]
      const hop = Math.abs(Math.sin(beat * Math.PI + d.phase)) * 0.13 * d.scale
      const sway = Math.sin(beat * Math.PI * 0.5 + d.phase) * d.sway

      scratch.euler.set(0, d.rotation, sway)
      scratch.quat.setFromEuler(scratch.euler)
      scratch.scale.setScalar(d.scale)
      scratch.pos.set(d.x, 0.6 * d.scale + hop + 0.18, d.z)
      scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale)
      body.setMatrixAt(i, scratch.matrix)

      scratch.pos.set(d.x - Math.sin(sway) * 0.18 * d.scale, 1.28 * d.scale + hop + 0.18, d.z)
      scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale)
      head.setMatrixAt(i, scratch.matrix)

      if (d.hasArm) {
        const wave = Math.sin(beat * Math.PI + d.phase) * 0.35
        scratch.euler.set(0, d.rotation, d.armSide * (0.35 + wave))
        scratch.quat.setFromEuler(scratch.euler)
        const ox = Math.cos(d.rotation) * 0.24 * d.armSide
        const oz = -Math.sin(d.rotation) * 0.24 * d.armSide
        scratch.pos.set(d.x + ox, 1.35 * d.scale + hop + 0.18, d.z + oz)
        scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale)
      } else {
        scratch.matrix.makeScale(0, 0, 0)
      }
      arm.setMatrixAt(i, scratch.matrix)
    }
    body.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    arm.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[geometries.body, material, count]} castShadow />
      <instancedMesh ref={headRef} args={[geometries.head, material, count]} />
      <instancedMesh ref={armRef} args={[geometries.arm, material, count]} />
    </group>
  )
})
