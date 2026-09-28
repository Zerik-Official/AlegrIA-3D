/**
 * A small knot of dancers around a fixed point — the same instanced
 * hop/sway crowd as {@link CarnivalCrowd}, scaled down and placed in local
 * space so it can be dropped inside any entity renderer (e.g. the concert
 * stage's audience), optionally waving glowing light sticks.
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
  /** Angle range (radians, from local `+X` towards `+Z`) they spread over; a full ring when omitted. */
  arc?: [number, number]
  /** Share of dancers with a raised arm. */
  armChance?: number
  /** Whether raised arms wave a glowing light stick. */
  glowsticks?: boolean
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

/** Spread used when no arc is given: all the way round. */
const FULL_RING: [number, number] = [0, Math.PI * 2]

/** Reused transform scratch. */
const scratch = {
  matrix: new THREE.Matrix4(),
  quat: new THREE.Quaternion(),
  euler: new THREE.Euler(),
  scale: new THREE.Vector3(),
  pos: new THREE.Vector3(),
  color: new THREE.Color(),
}

/** Light stick colors. */
const GLOWSTICK_COLORS = ['#49E9FF', '#FF007F', '#FFB703', '#39FF88', '#A855FF']

/**
 * @param count - How many dancers to scatter
 * @param radius - Outer spawn radius
 * @param exclude - Inner clear radius
 * @param arc - Angle range to spread over
 * @param armChance - Share of dancers with a raised arm
 * @returns Dancer list
 */
function buildDancers(count: number, radius: number, exclude: number, arc: [number, number], armChance: number): Dancer[] {
  return Array.from({ length: count }, () => {
    const angle = arc[0] + Math.random() * (arc[1] - arc[0])
    const r = exclude + Math.random() * (radius - exclude)
    return {
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      scale: 0.88 + Math.random() * 0.24,
      phase: Math.random() * Math.PI * 2,
      hasArm: Math.random() < armChance,
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
export const LocalDanceCrowd = memo(function LocalDanceCrowd({ count, radius, exclude, arc = FULL_RING, armChance = 0.35, glowsticks = false }: LocalDanceCrowdProps) {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const armRef = useRef<THREE.InstancedMesh>(null)
  const stickRef = useRef<THREE.InstancedMesh>(null)
  const geometries = useMemo(
    () => ({
      body: new THREE.CapsuleGeometry(0.21, 0.78, 4, 8),
      head: new THREE.SphereGeometry(0.15, 10, 8),
      arm: new THREE.CapsuleGeometry(0.05, 0.55, 2, 6),
      stick: new THREE.CapsuleGeometry(0.035, 0.42, 2, 6),
    }),
    []
  )
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 }), [])
  const stickMaterial = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), [])
  const dancers = useMemo(() => buildDancers(count, radius, exclude, arc, armChance), [count, radius, exclude, arc, armChance])

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
      stickRef.current?.setColorAt(i, scratch.color.set(GLOWSTICK_COLORS[i % GLOWSTICK_COLORS.length]))
    })
    const stick = stickRef.current
    if (stick) {
      stick.count = dancers.length
      if (stick.instanceColor) stick.instanceColor.needsUpdate = true
    }
    for (const mesh of [body, head, arm]) {
      mesh.count = dancers.length
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    const bodyMaterial = body.material as THREE.Material
    bodyMaterial.needsUpdate = true
  }, [dancers])

  useFrame(({ clock }) => {
    const body = bodyRef.current
    const head = headRef.current
    const arm = armRef.current
    const stick = stickRef.current
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
        arm.setMatrixAt(i, scratch.matrix)
        if (stick) {
          const tilt = d.armSide * (0.35 + wave)
          const reach = 0.54 * d.scale
          scratch.pos.set(d.x + ox - Math.sin(tilt) * reach * Math.cos(d.rotation), 1.35 * d.scale + hop + 0.18 + Math.cos(tilt) * reach, d.z + oz + Math.sin(tilt) * reach * Math.sin(d.rotation))
          scratch.matrix.compose(scratch.pos, scratch.quat, scratch.scale)
          stick.setMatrixAt(i, scratch.matrix)
        }
      } else {
        scratch.matrix.makeScale(0, 0, 0)
        arm.setMatrixAt(i, scratch.matrix)
        stick?.setMatrixAt(i, scratch.matrix)
      }
    }
    body.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    arm.instanceMatrix.needsUpdate = true
    if (stick) stick.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[geometries.body, material, count]} castShadow />
      <instancedMesh ref={headRef} args={[geometries.head, material, count]} />
      <instancedMesh ref={armRef} args={[geometries.arm, material, count]} />
      {glowsticks && <instancedMesh ref={stickRef} args={[geometries.stick, stickMaterial, count]} />}
    </group>
  )
})
