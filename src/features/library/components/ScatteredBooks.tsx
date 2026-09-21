// Abandoned library detail: books tossed on the floor, some open, dust implied via roughness
// No physics, just static meshes with random transforms — cheap and evocative
import { useMemo } from 'react'

type Scattered = {
  pos: [number, number, number]
  rot: [number, number, number]
  scale: [number, number, number]
  color: string
  open: boolean
}

export function ScatteredBooks() {
  const books: Scattered[] = useMemo(() => {
    const palette = ['#5b2a1a', '#8b4513', '#2c3e50', '#4a6741', '#7a3b2e', '#1e3a5f', '#6b4c2a', '#3d2b1f', '#4d1a0f']
    const entries: Scattered[] = []

    // hand-placed clusters for storytelling + random fill
    const clusters: Array<[number, number]> = [
      [2.2, 1.1],
      [-2.6, 0.8],
      [1.8, -2.4],
      [-1.4, -3.1],
      [3.4, 0.2],
      [-3.6, -1.2],
      [0.9, 3.2],
      [-2.0, 2.8],
    ]

    clusters.forEach(([x, z]) => {
      const count = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) {
        entries.push({
          pos: [x + (Math.random() - 0.5) * 1.1, 0.02, z + (Math.random() - 0.5) * 1.0],
          rot: [Math.random() * 0.25, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.35],
          scale: [0.52 + Math.random() * 0.18, 0.06 + Math.random() * 0.03, 0.36 + Math.random() * 0.12],
          color: palette[Math.floor(Math.random() * palette.length)],
          open: Math.random() > 0.55,
        })
      }
    })

    // extra singles near walls
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 4.2 + Math.random() * 4.8
      entries.push({
        pos: [Math.cos(angle) * r, 0.015, Math.sin(angle) * r],
        rot: [Math.random() * 0.18, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3],
        scale: [0.48 + Math.random() * 0.2, 0.055, 0.34 + Math.random() * 0.1],
        color: palette[Math.floor(Math.random() * palette.length)],
        open: Math.random() > 0.65,
      })
    }
    return entries
  }, [])

  return (
    <group>
      {books.map((b, i) => (
        <group key={i} position={b.pos} rotation-x={b.rot[0]} rotation-y={b.rot[1]} rotation-z={b.rot[2]}>
          {/* shadow contact */}
          <mesh position={[0, -0.008, 0]} rotation-x={-Math.PI / 2} scale={[1, 1, 1]}>
            <planeGeometry args={[b.scale[0] * 1.25, b.scale[2] * 1.25]} />
            <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
          </mesh>
          {/* cover */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={b.scale} />
            <meshStandardMaterial color={b.color} roughness={0.72} metalness={0.06} />
          </mesh>
          {/* pages edge */}
          <mesh position={[0, 0.018, 0]}>
            <boxGeometry args={[b.scale[0] * 0.96, 0.022, b.scale[2] * 0.96]} />
            <meshStandardMaterial color="#f5e6c8" roughness={0.95} />
          </mesh>
          {/* open books show inner spread */}
          {b.open && (
            <mesh position={[0, 0.032, 0]} rotation-y={0.22}>
              <boxGeometry args={[b.scale[0] * 0.9, 0.008, b.scale[2] * 0.92]} />
              <meshStandardMaterial color="#fff8e0" roughness={1} transparent opacity={0.92} />
            </mesh>
          )}
          {/* gold edge hint */}
          <mesh position={[b.scale[0] * 0.44, 0.005, 0]}>
            <boxGeometry args={[0.012, 0.02, b.scale[2] * 0.9]} />
            <meshStandardMaterial color="#c9a86a" metalness={0.45} roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* Dust motes near floor — subtle points */}
      <points position={[0, 0.18, 0]}>
        <sphereGeometry args={[5.2, 8, 8]} />
        <pointsMaterial size={0.018} color="#9a8a6a" transparent opacity={0.22} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  )
}
