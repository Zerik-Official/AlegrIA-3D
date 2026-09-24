/**
 * Paved street grid and central plaza for Phase 2's town, built from
 * {@link phase2StreetsConfig}.
 * @module features/phase2/components/parts/Phase2Streets
 */

import { phase2StreetsConfig, type StreetSegment } from '@/features/phase2/config/phase2Streets'

/**
 * @param segment - One street's axis/offset/length
 * @returns The sidewalk + road plane pair for that street
 */
function Street({ segment }: { segment: StreetSegment }) {
  const { roadWidth, sidewalkWidth, roadColor, sidewalkColor } = phase2StreetsConfig
  const sidewalkArgs: [number, number] = segment.axis === 'z' ? [sidewalkWidth, segment.length] : [segment.length, sidewalkWidth]
  const roadArgs: [number, number] = segment.axis === 'z' ? [roadWidth, segment.length] : [segment.length, roadWidth]
  const position: [number, number, number] =
    segment.axis === 'z' ? [segment.offset, 0.002, 0] : [0, 0.002, segment.offset]

  return (
    <group position={position}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={sidewalkArgs} />
        <meshStandardMaterial color={sidewalkColor} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={roadArgs} />
        <meshStandardMaterial color={roadColor} roughness={0.94} />
      </mesh>
    </group>
  )
}

/**
 * @returns Street grid sitting just above the ground plane
 */
export function Phase2Streets() {
  const { segments } = phase2StreetsConfig
  return (
    <group>
      {segments.map((segment, i) => (
        <Street key={i} segment={segment} />
      ))}
    </group>
  )
}
