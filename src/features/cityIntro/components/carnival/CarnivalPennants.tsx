import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { beatAt, CARNIVAL_NEON, PENNANT_POLES, POLE_BLOCKED_EAST_Z } from '@/features/cityIntro/config/carnivalLayout'

/** One pennant on a string. */
interface Pennant {
  position: THREE.Vector3
  yaw: number
  color: THREE.Color
  phase: number
  sway: number
}

/** Spacing between pennants along a string. */
const PENNANT_STEP = 0.5
/** How far a string sags at its middle, range. */
const SAG: [number, number] = [1.1, 1.6]

/**
 * @param z - Candidate pole Z on the east sidewalk
 * @returns Whether a pole can stand there
 */
function eastPoleFree(z: number): boolean {
  return !POLE_BLOCKED_EAST_Z.some(([minZ, maxZ]) => z > minZ && z < maxZ)
}

/** Material of the strings' cables. */
const CABLE_MATERIAL = new THREE.LineBasicMaterial({ color: '#2a2436' })

/** Reused transform scratch so the pennants allocate nothing per frame. */
const scratch = {
  matrix: new THREE.Matrix4(),
  quat: new THREE.Quaternion(),
  euler: new THREE.Euler(0, 0, 0, 'YXZ'),
  scale: new THREE.Vector3(1, 1, 1),
  color: new THREE.Color(),
}

/**
 * Electroluminescent pennant strings zig-zagging across the avenue between
 * slim poles on both sidewalks: each triangle sways on its own, and a pulse
 * of light runs along every string on the beat, with the odd flicker.
 *
 * @returns Strings, poles and pennants
 */
export const CarnivalPennants = memo(function CarnivalPennants() {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { strings, pennants, poles } = useMemo(() => {
    const { x, height, fromZ, toZ, spacing } = PENNANT_POLES
    const spans: Array<[THREE.Vector3, THREE.Vector3]> = []
    const poleSet = new Map<string, THREE.Vector3>()
    const addPole = (p: THREE.Vector3): void => {
      poleSet.set(`${p.x.toFixed(2)}:${p.z.toFixed(2)}`, new THREE.Vector3(p.x, 0, p.z))
    }
    for (let z = fromZ; z > toZ; z -= spacing) {
      const eastZ = z - (2 + Math.random() * 4)
      if (!eastPoleFree(eastZ)) continue
      const a = new THREE.Vector3(-x, height, z)
      const b = new THREE.Vector3(x, height, eastZ)
      spans.push([a, b])
      addPole(a)
      addPole(b)
      if (Math.random() < 0.5 && eastPoleFree(z + 1)) {
        const c = new THREE.Vector3(x, height - 0.2, z + 1)
        const d = new THREE.Vector3(-x, height - 0.35, z - (3 + Math.random() * 3))
        if (d.z > toZ) {
          spans.push([c, d])
          addPole(c)
          addPole(d)
        }
      }
    }

    const list: Pennant[] = []
    const lines: THREE.Line[] = []
    spans.forEach(([a, b], si) => {
      const mid = a.clone().lerp(b, 0.5)
      mid.y -= SAG[0] + Math.random() * (SAG[1] - SAG[0])
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
      lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), CABLE_MATERIAL))
      const count = Math.floor(curve.getLength() / PENNANT_STEP)
      for (let k = 1; k < count; k++) {
        const t = k / count
        const tangent = curve.getTangent(t)
        list.push({
          position: curve.getPoint(t),
          yaw: Math.atan2(tangent.x, tangent.z) - Math.PI / 2,
          color: new THREE.Color(CARNIVAL_NEON[(k + si) % 4]),
          phase: si * 0.9 + k * 0.25,
          sway: Math.random() * 6,
        })
      }
    })
    return { strings: lines, pennants: list, poles: [...poleSet.values()] }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.17, 0, 0, 0.17, 0, 0, 0, -0.42, 0], 3))
    geo.setIndex([0, 1, 2])
    geo.computeVertexNormals()
    return geo
  }, [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    pennants.forEach((p, i) => mesh.setColorAt(i, p.color))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [pennants])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    const { beat } = beatAt(t)
    for (let i = 0; i < pennants.length; i++) {
      const p = pennants[i]
      scratch.euler.set(Math.sin(t * 2.2 + p.sway) * 0.25, p.yaw, 0)
      scratch.quat.setFromEuler(scratch.euler)
      scratch.matrix.compose(p.position, scratch.quat, scratch.scale)
      mesh.setMatrixAt(i, scratch.matrix)
      const wave = Math.pow(0.5 + 0.5 * Math.cos(beat * Math.PI * 2 - p.phase), 4)
      const flicker = Math.random() < 0.004 ? 0.2 : 1
      mesh.setColorAt(i, scratch.color.copy(p.color).multiplyScalar((0.5 + 1.1 * wave) * flicker))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <group>
      {strings.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
      {poles.map((p) => (
        <group key={`${p.x}:${p.z}`} position={[p.x, 0, p.z]}>
          <mesh position={[0, PENNANT_POLES.height / 2, 0]}>
            <cylinderGeometry args={[0.05, 0.07, PENNANT_POLES.height, 8]} />
            <meshStandardMaterial color="#1c1a24" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, PENNANT_POLES.height + 0.08, 0]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshBasicMaterial color="#FFD60A" toneMapped={false} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={meshRef} args={[geometry, undefined, pennants.length]} frustumCulled={false}>
        <meshBasicMaterial transparent opacity={0.92} side={THREE.DoubleSide} toneMapped={false} />
      </instancedMesh>
    </group>
  )
})
