/**
 * Railway tunnel mouth: a stone portal with an arched opening set into an
 * earth mound, dark inside. The opening faces local `+X` and the bore runs
 * towards local `-X`, so the track passes through along the X axis.
 * @module features/phase1/components/parts/RailTunnel
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'

/** Half-width of the arched opening. */
export const TUNNEL_OPENING_HALF_WIDTH = 2.4
/** Height of the opening's straight jambs, below the arch. */
const OPENING_JAMB_HEIGHT = 3.6
/** Depth of the stone portal. */
export const TUNNEL_PORTAL_DEPTH = 1
/** Length of the mound behind the portal. */
export const TUNNEL_BODY_LENGTH = 12
/** Half-width and height of the portal's stone face. */
const PORTAL_HALF_WIDTH = 5.8
const PORTAL_HEIGHT = 7.4
/** Half-width and height of the earth mound. */
const MOUND_HALF_WIDTH = 7
const MOUND_HEIGHT = 6.6
/** How far the portal and the mound reach below the ground, so they seat on sloping terrain. */
const FOOTING_DEPTH = 2

/**
 * @param inset - How far the outline is pulled in from the opening's edge
 * @returns The arched opening, in the portal's 2D profile plane (x across, y up)
 */
function createOpeningPath(inset = 0): THREE.Shape {
  const halfWidth = TUNNEL_OPENING_HALF_WIDTH - inset
  const path = new THREE.Shape()
  path.moveTo(-halfWidth, 0)
  path.lineTo(-halfWidth, OPENING_JAMB_HEIGHT)
  path.absarc(0, OPENING_JAMB_HEIGHT, halfWidth, Math.PI, 0, true)
  path.lineTo(halfWidth, 0)
  path.closePath()
  return path
}

/**
 * @param length - Bore length
 * @returns Arched solid slightly smaller than the opening, drawn from inside as the dark bore lining
 */
function createLiningGeometry(length: number): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(createOpeningPath(0.03), { depth: length, bevelEnabled: false, curveSegments: 18 })
}

/**
 * @returns Stone portal face with the opening cut out
 */
function createPortalGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(-PORTAL_HALF_WIDTH, -FOOTING_DEPTH)
  shape.lineTo(-PORTAL_HALF_WIDTH, PORTAL_HEIGHT)
  shape.lineTo(PORTAL_HALF_WIDTH, PORTAL_HEIGHT)
  shape.lineTo(PORTAL_HALF_WIDTH, -FOOTING_DEPTH)
  shape.closePath()
  shape.holes.push(createOpeningPath())
  return new THREE.ExtrudeGeometry(shape, { depth: TUNNEL_PORTAL_DEPTH, bevelEnabled: false })
}

/**
 * @returns Earth mound with the bore cut through it
 */
function createMoundGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(-MOUND_HALF_WIDTH, -FOOTING_DEPTH)
  shape.lineTo(-MOUND_HALF_WIDTH, 0)
  shape.absellipse(0, 0, MOUND_HALF_WIDTH, MOUND_HEIGHT, Math.PI, 0, true, 0)
  shape.lineTo(MOUND_HALF_WIDTH, -FOOTING_DEPTH)
  shape.closePath()
  shape.holes.push(createOpeningPath())
  return new THREE.ExtrudeGeometry(shape, { depth: TUNNEL_BODY_LENGTH, bevelEnabled: false, curveSegments: 18 })
}

/**
 * @returns Tunnel group at the entity's origin, the opening's center on the ground
 */
export const RailTunnel = memo(function RailTunnel() {
  const portal = useMemo(() => createPortalGeometry(), [])
  const mound = useMemo(() => createMoundGeometry(), [])
  const boreLength = TUNNEL_PORTAL_DEPTH + TUNNEL_BODY_LENGTH
  const lining = useMemo(() => createLiningGeometry(boreLength), [boreLength])

  return (
    <group>
      <mesh geometry={portal} rotation-y={-Math.PI / 2} castShadow receiveShadow>
        <meshStandardMaterial color="#8a7a66" roughness={0.95} />
      </mesh>
      <mesh position={[-TUNNEL_PORTAL_DEPTH / 2 + 0.1, PORTAL_HEIGHT + 0.22, 0]} castShadow>
        <boxGeometry args={[TUNNEL_PORTAL_DEPTH + 0.4, 0.45, PORTAL_HALF_WIDTH * 2 + 0.4]} />
        <meshStandardMaterial color="#6f604e" roughness={0.95} />
      </mesh>
      <mesh position={[0.02, OPENING_JAMB_HEIGHT + TUNNEL_OPENING_HALF_WIDTH + 0.1, 0]}>
        <boxGeometry args={[0.1, 0.9, 0.7]} />
        <meshStandardMaterial color="#b3a288" roughness={0.9} />
      </mesh>
      <mesh geometry={mound} position={[-TUNNEL_PORTAL_DEPTH, 0, 0]} rotation-y={-Math.PI / 2} castShadow receiveShadow>
        <meshStandardMaterial color="#4f5a2a" roughness={1} />
      </mesh>
      <mesh geometry={lining} position={[-0.02, 0, 0]} rotation-y={-Math.PI / 2}>
        <meshBasicMaterial color="#050403" side={THREE.BackSide} />
      </mesh>
    </group>
  )
})
