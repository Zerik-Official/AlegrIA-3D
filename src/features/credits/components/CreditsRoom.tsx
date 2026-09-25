/**
 * Low-poly recreation of the RIWI coworking room the credits scene is staged
 * in: the two square columns Omar dances between, rows of empty
 * workstations (desks, monitors, keyboards, chairs, backpacks — no people),
 * the ceiling's AC units, red pipe and cable tray, the roll-up blinds and the
 * glass door. Built from plain geometries, matching the reference photos'
 * layout rather than tracing them exactly.
 * @module features/credits/components/CreditsRoom
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { canvasTexture } from '@/features/cityIntro/components/carnival/neonCanvas'

/** Room half-extents on the floor. */
const HALF_X = 9
const HALF_Z = 6.5
/** Ceiling height. */
const WALL_H = 4.2
const WALL_T = 0.2

const materials = {
  floor: new THREE.MeshStandardMaterial({ color: '#8f8f8f', roughness: 0.92, metalness: 0.05 }),
  wall: new THREE.MeshStandardMaterial({ color: '#efe9dd', roughness: 0.96 }),
  ceiling: new THREE.MeshStandardMaterial({ color: '#d8d6cf', roughness: 0.95 }),
  column: new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: 0.85 }),
  desk: new THREE.MeshStandardMaterial({ color: '#c9a878', roughness: 0.7 }),
  deskLeg: new THREE.MeshStandardMaterial({ color: '#26262c', roughness: 0.5, metalness: 0.4 }),
  monitor: new THREE.MeshStandardMaterial({ color: '#0c0c10', roughness: 0.4, metalness: 0.2 }),
  monitorStand: new THREE.MeshStandardMaterial({ color: '#3a3a42', roughness: 0.5, metalness: 0.3 }),
  keyboard: new THREE.MeshStandardMaterial({ color: '#1c1c22', roughness: 0.6 }),
  chairSeat: new THREE.MeshStandardMaterial({ color: '#17171b', roughness: 0.7 }),
  chairMesh: new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: 0.8 }),
  backpack: new THREE.MeshStandardMaterial({ color: '#5a2430', roughness: 0.85 }),
  pipe: new THREE.MeshStandardMaterial({ color: '#a3352c', roughness: 0.55, metalness: 0.3 }),
  tray: new THREE.MeshStandardMaterial({ color: '#4a4a52', roughness: 0.5, metalness: 0.5 }),
  ac: new THREE.MeshStandardMaterial({ color: '#f2f2f0', roughness: 0.5, metalness: 0.15 }),
  blind: new THREE.MeshStandardMaterial({ color: '#0e0e12', roughness: 0.75 }),
  banner: new THREE.MeshStandardMaterial({ color: '#1a2a6e', roughness: 0.5, emissive: '#1a2a6e', emissiveIntensity: 0.25 }),
  glassFrame: new THREE.MeshStandardMaterial({ color: '#151519', roughness: 0.4, metalness: 0.6 }),
  glass: new THREE.MeshStandardMaterial({ color: '#bcd8ea', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 }),
  trim: new THREE.MeshStandardMaterial({ color: '#2a2620', roughness: 0.7 }),
  columnCap: new THREE.MeshStandardMaterial({ color: '#e2dccb', roughness: 0.6, metalness: 0.1 }),
}

/** One workstation: desk slice already drawn by the row — this is the chair + monitor + keyboard + optional backpack. */
function Workstation({ x, z, facing, backpack }: { x: number; z: number; facing: number; backpack: boolean }) {
  return (
    <group position={[x, 0, z]} rotation-y={facing}>
      {/* monitor */}
      <mesh position={[0, 0.78, 0.35]} castShadow material={materials.monitorStand}>
        <boxGeometry args={[0.05, 0.22, 0.05]} />
      </mesh>
      <mesh position={[0, 0.95, 0.35]} castShadow material={materials.monitor}>
        <boxGeometry args={[0.5, 0.32, 0.04]} />
      </mesh>
      {/* keyboard + mouse */}
      <mesh position={[0, 0.66, 0.14]} material={materials.keyboard}>
        <boxGeometry args={[0.4, 0.02, 0.14]} />
      </mesh>
      <mesh position={[0.26, 0.665, 0.1]} material={materials.keyboard}>
        <boxGeometry args={[0.05, 0.02, 0.08]} />
      </mesh>
      {/* chair, pulled a bit back from the desk */}
      <group position={[0, 0, 0.75]}>
        <mesh position={[0, 0.46, 0]} castShadow material={materials.chairSeat}>
          <boxGeometry args={[0.42, 0.06, 0.42]} />
        </mesh>
        <mesh position={[0, 0.78, 0.19]} castShadow material={materials.chairMesh}>
          <boxGeometry args={[0.4, 0.6, 0.06]} />
        </mesh>
        <mesh position={[0, 0.22, 0]} material={materials.deskLeg}>
          <cylinderGeometry args={[0.03, 0.03, 0.44, 8]} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.22, 0.03, Math.sin(a) * 0.22]} material={materials.deskLeg}>
              <boxGeometry args={[0.16, 0.03, 0.05]} />
            </mesh>
          )
        })}
      </group>
      {backpack && (
        <mesh position={[0.32, 0.16, 0.68]} rotation-z={0.15} castShadow material={materials.backpack}>
          <boxGeometry args={[0.22, 0.32, 0.14]} />
        </mesh>
      )}
    </group>
  )
}

/** A long desk with several workstations along it. */
function DeskRow({ z, facing, count, spacing, xStart }: { z: number; facing: number; count: number; spacing: number; xStart: number }) {
  const seats = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ x: xStart + i * spacing, backpack: i % 2 === 0 })),
    [count, spacing, xStart]
  )
  const length = (count - 1) * spacing + 1.1
  return (
    <group>
      <mesh position={[xStart + ((count - 1) * spacing) / 2, 0.72, z]} castShadow receiveShadow material={materials.desk}>
        <boxGeometry args={[length, 0.05, 0.75]} />
      </mesh>
      {[xStart - 0.5, xStart + (count - 1) * spacing + 0.5].map((legX) => (
        <group key={legX}>
          <mesh position={[legX, 0.36, z - 0.3]} material={materials.deskLeg}>
            <boxGeometry args={[0.05, 0.72, 0.05]} />
          </mesh>
          <mesh position={[legX, 0.36, z + 0.3]} material={materials.deskLeg}>
            <boxGeometry args={[0.05, 0.72, 0.05]} />
          </mesh>
        </group>
      ))}
      {seats.map((s) => (
        <Workstation key={s.x} x={s.x} z={z} facing={facing} backpack={s.backpack} />
      ))}
    </group>
  )
}

/** Ceiling-hung services: the cable tray, red pipe and two AC cassettes. */
const CeilingServices = memo(function CeilingServices() {
  return (
    <group>
      <mesh position={[-2, WALL_H - 0.22, -1]} material={materials.tray}>
        <boxGeometry args={[0.5, 0.12, HALF_Z * 2 - 1]} />
      </mesh>
      <mesh position={[-2, WALL_H - 0.5, -1]} rotation-z={Math.PI / 2} material={materials.pipe}>
        <cylinderGeometry args={[0.07, 0.07, HALF_Z * 2 - 2, 10]} />
      </mesh>
      {[-4.5, 3.5].map((x) => (
        <group key={x} position={[x, WALL_H - 0.05, 0]}>
          <mesh castShadow material={materials.ac}>
            <boxGeometry args={[1.5, 0.32, 0.85]} />
          </mesh>
          <mesh position={[0, -0.17, 0]} material={materials.tray}>
            <boxGeometry args={[1.3, 0.03, 0.65]} />
          </mesh>
        </group>
      ))}
    </group>
  )
})

/** A dark roll-up window blind mounted on a wall. */
function RollUpBlind({ x, z, rotationY }: { x: number; z: number; rotationY: number }) {
  return (
    <mesh position={[x, WALL_H - 1.5, z]} rotation-y={rotationY} material={materials.blind}>
      <boxGeometry args={[1.3, 2.3, 0.04]} />
    </mesh>
  )
}

/** The standing blue "RIWI" banner seen against the back wall. */
function RiwiBanner({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]} castShadow material={materials.banner}>
        <boxGeometry args={[0.7, 1.8, 0.05]} />
      </mesh>
      <mesh position={[0, 1.75, 0]} material={materials.banner}>
        <boxGeometry args={[0.7, 0.1, 0.05]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={materials.deskLeg}>
        <cylinderGeometry args={[0.28, 0.32, 0.04, 16]} />
      </mesh>
    </group>
  )
}

/** The two square columns Omar dances between, with a capital and base for a bit of architectural detail. */
function CenterColumns() {
  return (
    <group>
      {[-2.4, 2.4].map((x) => (
        <group key={x}>
          <mesh position={[x, WALL_H / 2, 0]} castShadow receiveShadow material={materials.column}>
            <boxGeometry args={[0.62, WALL_H, 0.62]} />
          </mesh>
          <mesh position={[x, WALL_H - 0.14, 0]} material={materials.columnCap}>
            <boxGeometry args={[0.78, 0.16, 0.78]} />
          </mesh>
          <mesh position={[x, 0.1, 0]} material={materials.columnCap}>
            <boxGeometry args={[0.78, 0.16, 0.78]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Warm spotlight pool on the floor where Omar dances, between the columns. */
const StageGlow = memo(function StageGlow() {
  const texture = useMemo(
    () =>
      canvasTexture(128, 128, (c, w, h) => {
        const gradient = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
        gradient.addColorStop(0, 'rgba(255,210,140,0.85)')
        gradient.addColorStop(0.55, 'rgba(200,120,255,0.35)')
        gradient.addColorStop(1, 'rgba(168,85,255,0)')
        c.fillStyle = gradient
        c.fillRect(0, 0, w, h)
      }),
    []
  )
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]}>
      <planeGeometry args={[5.5, 5.5]} />
      <meshBasicMaterial map={texture} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
})

/** Thin baseboard trim running along the room's walls, for a finished, less flat look. */
function BaseTrim() {
  const h = 0.12
  return (
    <group position={[0, h / 2, 0]}>
      {[-HALF_Z, HALF_Z].map((z) => (
        <mesh key={z} position={[0, 0, z]} material={materials.trim}>
          <boxGeometry args={[HALF_X * 2, h, 0.04]} />
        </mesh>
      ))}
      <mesh position={[-HALF_X, 0, 0]} material={materials.trim}>
        <boxGeometry args={[0.04, h, HALF_Z * 2]} />
      </mesh>
    </group>
  )
}

/** The glass entrance door on the east wall. */
function GlassDoor() {
  return (
    <group position={[HALF_X - WALL_T / 2, 0, 2.4]} rotation-y={-Math.PI / 2}>
      <mesh position={[0, 1.05, 0]} material={materials.glass}>
        <planeGeometry args={[1.9, 2.1]} />
      </mesh>
      <mesh position={[0, 1.05, 0.01]} material={materials.glassFrame}>
        <boxGeometry args={[1.95, 2.15, 0.03]} />
      </mesh>
    </group>
  )
}

/**
 * The room shell — floor, four walls with a gap for the door, and ceiling.
 * @returns Shell group
 */
function RoomShell() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={materials.floor}>
        <planeGeometry args={[HALF_X * 2, HALF_Z * 2]} />
      </mesh>
      <mesh position={[0, WALL_H, 0]} rotation-x={Math.PI / 2} material={materials.ceiling}>
        <planeGeometry args={[HALF_X * 2, HALF_Z * 2]} />
      </mesh>
      {/* back (north) and front (south) walls */}
      {[-HALF_Z, HALF_Z].map((z) => (
        <mesh key={z} position={[0, WALL_H / 2, z]} material={materials.wall}>
          <boxGeometry args={[HALF_X * 2, WALL_H, WALL_T]} />
        </mesh>
      ))}
      {/* west wall, solid */}
      <mesh position={[-HALF_X, WALL_H / 2, 0]} material={materials.wall}>
        <boxGeometry args={[WALL_T, WALL_H, HALF_Z * 2]} />
      </mesh>
      {/* east wall, split around the door gap */}
      <mesh position={[HALF_X, WALL_H / 2, -3.3]} material={materials.wall}>
        <boxGeometry args={[WALL_T, WALL_H, HALF_Z * 2 - 6.6]} />
      </mesh>
      <mesh position={[HALF_X, WALL_H / 2, 5.4]} material={materials.wall}>
        <boxGeometry args={[WALL_T, WALL_H, HALF_Z * 2 - 9.4]} />
      </mesh>
    </group>
  )
}

/**
 * The whole recreated room: shell, columns, ceiling services, blinds, the
 * banner, the door and two rows of empty workstations.
 * @returns Room group
 */
export const CreditsRoom = memo(function CreditsRoom() {
  return (
    <group>
      <RoomShell />
      <BaseTrim />
      <CenterColumns />
      <StageGlow />
      <CeilingServices />
      <RollUpBlind x={-5.5} z={-HALF_Z + WALL_T / 2} rotationY={0} />
      <RollUpBlind x={-2.8} z={-HALF_Z + WALL_T / 2} rotationY={0} />
      <RiwiBanner x={5.5} z={-HALF_Z + 0.6} />
      <GlassDoor />

      <DeskRow z={4.6} facing={Math.PI} count={5} spacing={1.55} xStart={-6.5} />
      <DeskRow z={-4.6} facing={0} count={5} spacing={1.55} xStart={-6.5} />

      {/* Warm overhead key light, softer than a flat office wash. */}
      <pointLight position={[0, WALL_H - 0.4, 0]} intensity={0.9} distance={16} decay={2} color="#fff2dc" />
      <pointLight position={[-4.5, WALL_H - 0.4, 3]} intensity={0.55} distance={12} decay={2} color="#fff2dc" />
      <pointLight position={[4.5, WALL_H - 0.4, -3]} intensity={0.55} distance={12} decay={2} color="#fff2dc" />

      {/* Gold/magenta stage accents flanking the columns, echoing the credits overlay's palette. */}
      <pointLight position={[-2.4, 1.6, 1.6]} intensity={1.3} distance={7} decay={2} color="#ffcc33" />
      <pointLight position={[2.4, 1.6, -1.6]} intensity={1.3} distance={7} decay={2} color="#a855ff" />
      <spotLight position={[0, WALL_H - 0.2, 0]} intensity={2.4} distance={9} angle={0.55} penumbra={0.7} decay={2} color="#ffd9a0" />
    </group>
  )
})
