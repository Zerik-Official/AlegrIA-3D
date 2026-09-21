import { useMemo } from 'react'
import * as THREE from 'three'

function PedestalDisplay({ position, rotationY = 0, color = '#2a3a56' }: { position: [number, number, number]; rotationY?: number; color?: string }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.44, 1.0]} />
        <meshStandardMaterial color="#0e1116" roughness={0.55} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.92, 0.02, 0.92]} />
        <meshStandardMaterial color="#c9a86a" emissive="#ffb400" emissiveIntensity={0.18} />
      </mesh>
      {/* Exhibit */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.42, 0.58, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.95, 0.13]} castShadow>
        <boxGeometry args={[0.44, 0.6, 0.02]} />
        <meshPhysicalMaterial color="#eef3ff" transparent opacity={0.18} roughness={0.08} metalness={0.1} transmission={0.9} thickness={0.02} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} intensity={0.9} distance={2.8} color="#ffe9a0" decay={2} />
    </group>
  )
}

function Painting({ position, rotationY, width = 1.9, height = 1.25 }: { position: [number, number, number]; rotationY: number; width?: number; height?: number }) {
  const hue = useMemo(() => 22 + Math.random() * 32, [])
  return (
    <group position={position} rotation-y={rotationY}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[width + 0.14, height + 0.14, 0.06]} />
        <meshStandardMaterial color="#1a1208" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.02]} />
        <meshStandardMaterial color="#c9a86a" metalness={0.55} roughness={0.35} />
      </mesh>
      {/* Canvas */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={new THREE.Color(`hsl(${hue}, 55%, 62%)`)} roughness={0.95} />
      </mesh>
      {/* Abstract shapes */}
      <mesh position={[0.22, 0.18, 0.06]}>
        <planeGeometry args={[width * 0.38, height * 0.32]} />
        <meshStandardMaterial color="#0a0f1e" transparent opacity={0.85} />
      </mesh>
      <spotLight position={[0, 0.9, 0.9]} angle={0.45} penumbra={0.7} intensity={2.2} color="#ffe9a0" distance={4} />
    </group>
  )
}

export function MuseumScene() {
  return (
    <group>
      {/* Floor marble */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#f2ede6" roughness={0.22} metalness={0.04} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#ece6da" roughness={0.35} />
      </mesh>
      <gridHelper args={[24, 24, '#d6ccb6', '#e8e0cc']} position={[0, 0.005, 0]} />

      {/* Ceiling skylight */}
      <mesh rotation-x={Math.PI / 2} position={[0, 6.2, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#0d0f14" roughness={1} />
      </mesh>
      {/* Skylight panel */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 6.18, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#dbeaff" emissive="#a8c8ff" emissiveIntensity={0.35} transparent opacity={0.82} side={THREE.DoubleSide} />
      </mesh>
      {/* Beams */}
      {[-8, -4, 0, 4, 8].map((z) => (
        <mesh key={z} position={[0, 6.0, z]}>
          <boxGeometry args={[26, 0.18, 0.16]} />
          <meshStandardMaterial color="#1e2430" roughness={0.7} />
        </mesh>
      ))}

      {/* Walls */}
      <mesh position={[0, 3.1, -13]} receiveShadow>
        <boxGeometry args={[26, 6.2, 0.5]} />
        <meshStandardMaterial color="#eef1f6" roughness={0.92} />
      </mesh>
      <mesh position={[0, 3.1, 13]} receiveShadow>
        <boxGeometry args={[26, 6.2, 0.5]} />
        <meshStandardMaterial color="#eef1f6" roughness={0.92} />
      </mesh>
      <mesh position={[-13, 3.1, 0]} receiveShadow>
        <boxGeometry args={[0.5, 6.2, 26]} />
        <meshStandardMaterial color="#eef1f6" roughness={0.92} />
      </mesh>
      <mesh position={[13, 3.1, 0]} receiveShadow>
        <boxGeometry args={[0.5, 6.2, 26]} />
        <meshStandardMaterial color="#eef1f6" roughness={0.92} />
      </mesh>

      {/* Columns */}
      {[
        [-11, 0, -6],
        [-11, 0, 6],
        [11, 0, -6],
        [11, 0, 6],
        [-5.5, 0, -11.2],
        [5.5, 0, -11.2],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 3.0, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.44, 6.0, 20]} />
            <meshStandardMaterial color="#f7f3ea" roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.52, 0.58, 0.36, 20]} />
            <meshStandardMaterial color="#1e2430" roughness={0.6} />
          </mesh>
          <mesh position={[0, 5.92, 0]}>
            <boxGeometry args={[0.95, 0.18, 0.95]} />
            <meshStandardMaterial color="#1e2430" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Paintings on walls */}
      <Painting position={[-12.68, 2.4, -3.2]} rotationY={Math.PI / 2} />
      <Painting position={[-12.68, 2.4, 1.1]} rotationY={Math.PI / 2} width={1.5} height={1.0} />
      <Painting position={[12.68, 2.4, -1.8]} rotationY={-Math.PI / 2} />
      <Painting position={[12.68, 2.4, 3.5]} rotationY={-Math.PI / 2} width={2.2} height={1.4} />
      <Painting position={[-2.2, 2.2, -12.68]} rotationY={0} width={2.4} height={1.6} />
      <Painting position={[4.2, 2.2, -12.68]} rotationY={0} width={1.8} height={1.2} />

      {/* Display pedestals */}
      <PedestalDisplay position={[-4.2, 0, -2.0]} color="#3a2a1a" />
      <PedestalDisplay position={[4.2, 0, -1.2]} color="#1e3a5f" rotationY={0.4} />
      <PedestalDisplay position={[-4.0, 0, 4.5]} color="#4a2530" rotationY={-0.3} />
      <PedestalDisplay position={[3.2, 0, 5.2]} color="#2a4a3a" rotationY={0.6} />
      <PedestalDisplay position={[0, 0, 0.4]} color="#5b2a1a" />

      {/* Central sculpture spot */}
      <pointLight position={[0, 5.5, 0]} intensity={1.8} distance={7} color="#a8c8ff" decay={2} />
      <spotLight position={[0, 5.8, 0]} angle={0.42} penumbra={0.6} intensity={14} color="#dbeaff" distance={14} castShadow />

      {/* Ambient */}
      <ambientLight intensity={0.72} color="#eaf0ff" />
      <hemisphereLight args={['#dbeaff', '#f2ede6', 0.55]} />
      <directionalLight position={[6, 8, 4]} intensity={1.1} color="#fff7e8" castShadow shadow-mapSize={[2048, 2048]} />
    </group>
  )
}
