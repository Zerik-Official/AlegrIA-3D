import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { ReadingTable, SectionSign } from '@/features/library/components/LibraryFurnishings'
import { ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { createParquetTexture } from '@/shared/utils/textures'
import { BookPageDisplays } from '@/features/library/components/BookPageDisplays'
import {
  AISLE_SHELVES,
  CEILING_Y,
  RESTORED_PLANTERS,
  RESTORED_READING_TABLES,
  SECTION_SIGNS,
  SHELF_HEIGHT,
  TABLE_TOP_Y,
  WALL_SHELVES,
} from '@/features/library/config/libraryLayout'

/** Half the hall's edge length — walls stand on these lines. */
const HALF = 11
/** Height of the wooden wainscot running along every wall. */
const WAINSCOT_H = 1.15
/** Radius of the arch framing the portal's alcove on the back wall. */
const ARCH_R = 2.1
/** Height the arch's columns rise to before it springs. */
const ARCH_SPRING_Y = 2.9

/** Shared materials, so the many repeated trims and pilasters don't each allocate one. */
const mats = {
  plaster: new THREE.MeshStandardMaterial({ color: '#e9d6b2', roughness: 0.92 }),
  wood: new THREE.MeshStandardMaterial({ color: '#5a3218', roughness: 0.55, metalness: 0.05 }),
  darkWood: new THREE.MeshStandardMaterial({ color: '#3a1f0e', roughness: 0.6 }),
  gold: new THREE.MeshStandardMaterial({ color: '#c9a86a', roughness: 0.28, metalness: 0.75, emissive: '#3a2608', emissiveIntensity: 0.35 }),
  pilaster: new THREE.MeshStandardMaterial({ color: '#d9c197', roughness: 0.7 }),
  ceiling: new THREE.MeshStandardMaterial({ color: '#4a2c16', roughness: 0.8 }),
  rug: new THREE.MeshStandardMaterial({ color: '#7a1a2e', roughness: 0.95 }),
  rugInner: new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.95 }),
  terracotta: new THREE.MeshStandardMaterial({ color: '#b3582e', roughness: 0.85 }),
  lampShade: new THREE.MeshStandardMaterial({ color: '#2f6b3a', roughness: 0.35, emissive: '#1a4a22', emissiveIntensity: 0.6 }),
  candle: new THREE.MeshStandardMaterial({ color: '#fff1c4', emissive: '#ffcc66', emissiveIntensity: 2.2 }),
  skylight: new THREE.MeshBasicMaterial({ color: '#fff4dc' }),
}

/** One wall run: center, length along its own X, and Y rotation. */
interface WallRun {
  position: [number, number]
  length: number
  rotationY: number
}

/** The four walls, split where the entrance and the portal's arch open through them. */
const WALL_RUNS: WallRun[] = [
  { position: [-(HALF + ARCH_R) / 2, -HALF], length: HALF - ARCH_R, rotationY: 0 },
  { position: [(HALF + ARCH_R) / 2, -HALF], length: HALF - ARCH_R, rotationY: 0 },
  { position: [-6.5, HALF], length: 9, rotationY: Math.PI },
  { position: [6.5, HALF], length: 9, rotationY: Math.PI },
  { position: [-HALF, 0], length: HALF * 2, rotationY: Math.PI / 2 },
  { position: [HALF, 0], length: HALF * 2, rotationY: -Math.PI / 2 },
]

/**
 * A plastered wall with a wooden wainscot, gilded rails and evenly spaced
 * pilasters, facing into the hall (its local `+Z`).
 * @param props - Wall run
 * @returns Wall group
 */
const PanelledWall = memo(function PanelledWall({ position, length, rotationY }: WallRun) {
  const pilasters = Math.max(1, Math.round(length / 3.6))
  return (
    <group position={[position[0], 0, position[1]]} rotation-y={rotationY}>
      <mesh position={[0, CEILING_Y / 2, 0]} material={mats.plaster} receiveShadow>
        <boxGeometry args={[length, CEILING_Y, 0.45]} />
      </mesh>
      <mesh position={[0, WAINSCOT_H / 2, 0.25]} material={mats.wood} receiveShadow>
        <boxGeometry args={[length, WAINSCOT_H, 0.06]} />
      </mesh>
      <mesh position={[0, WAINSCOT_H, 0.29]} material={mats.gold}>
        <boxGeometry args={[length, 0.06, 0.05]} />
      </mesh>
      <mesh position={[0, CEILING_Y - 0.3, 0.27]} material={mats.gold}>
        <boxGeometry args={[length, 0.12, 0.08]} />
      </mesh>
      {Array.from({ length: pilasters + 1 }).map((_, i) => (
        <mesh key={i} position={[-length / 2 + (i * length) / pilasters, CEILING_Y / 2, 0.3]} material={mats.pilaster}>
          <boxGeometry args={[0.32, CEILING_Y, 0.14]} />
        </mesh>
      ))}
    </group>
  )
})

/**
 * The arch on the back wall that frames the alcove where the portal to the
 * future opens: two gilded columns and a half-ring over a deep niche.
 * @returns Arch group
 */
const PortalArch = memo(function PortalArch() {
  return (
    <group position={[0, 0, -HALF]}>
      <mesh position={[0, CEILING_Y / 2, -0.4]}>
        <boxGeometry args={[ARCH_R * 2, CEILING_Y, 0.3]} />
        <meshStandardMaterial color="#1a1030" roughness={0.9} emissive="#1a2a5a" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, (CEILING_Y + ARCH_SPRING_Y + ARCH_R) / 2, 0]} material={mats.plaster}>
        <boxGeometry args={[ARCH_R * 2, CEILING_Y - ARCH_SPRING_Y - ARCH_R + 0.4, 0.45]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * ARCH_R, 0, 0.25]}>
          <mesh position={[0, ARCH_SPRING_Y / 2, 0]} material={mats.pilaster} castShadow>
            <cylinderGeometry args={[0.22, 0.26, ARCH_SPRING_Y, 20]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={mats.gold}>
            <boxGeometry args={[0.6, 0.2, 0.6]} />
          </mesh>
          <mesh position={[0, ARCH_SPRING_Y, 0]} material={mats.gold}>
            <boxGeometry args={[0.6, 0.16, 0.6]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, ARCH_SPRING_Y, 0.25]} material={mats.gold}>
        <torusGeometry args={[ARCH_R, 0.16, 12, 48, Math.PI]} />
      </mesh>
      <mesh position={[0, ARCH_SPRING_Y + ARCH_R + 0.15, 0.3]} material={mats.gold}>
        <boxGeometry args={[0.5, 0.5, 0.12]} />
      </mesh>
    </group>
  )
})

/**
 * Props for {@link Chandelier}.
 */
interface ChandelierProps {
  /** `[x, z]` floor position it hangs above. */
  position: [number, number]
  /** Ring radius — the central one is grander. */
  radius?: number
  /** Light intensity. */
  intensity?: number
}

/**
 * Gilded ring chandelier with candle bulbs and one warm light, swaying ever so slightly.
 * @param props - Placement and size
 * @returns Chandelier group
 */
const Chandelier = memo(function Chandelier({ position, radius = 0.55, intensity = 3 }: ChandelierProps) {
  const ref = useRef<THREE.Group>(null)
  const candles = 8
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5 + position[0]) * 0.015
  })
  const hangY = CEILING_Y - 1.4
  return (
    <group ref={ref} position={[position[0], CEILING_Y, position[1]]}>
      <mesh position={[0, -0.7, 0]} material={mats.gold}>
        <cylinderGeometry args={[0.015, 0.015, 1.4, 6]} />
      </mesh>
      <group position={[0, hangY - CEILING_Y, 0]}>
        <mesh rotation-x={Math.PI / 2} material={mats.gold}>
          <torusGeometry args={[radius, 0.035, 8, 40]} />
        </mesh>
        <mesh position={[0, -0.18, 0]} material={mats.gold}>
          <sphereGeometry args={[0.1, 16, 16]} />
        </mesh>
        {Array.from({ length: candles }).map((_, i) => {
          const a = (i / candles) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * radius, 0.1, Math.sin(a) * radius]} material={mats.candle}>
              <sphereGeometry args={[0.05, 10, 10]} />
            </mesh>
          )
        })}
        <pointLight intensity={intensity} distance={9} color="#ffd79a" decay={2} />
      </group>
    </group>
  )
})

/**
 * A terracotta planter with a flowering trinitaria — the barrio's own flower,
 * brought indoors now the hall is cared for again.
 * @param props - Floor position and bloom color
 * @returns Planter group
 */
const Planter = memo(function Planter({ position, bloomColor }: { position: [number, number]; bloomColor: string }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.3, 0]} material={mats.terracotta} castShadow>
        <cylinderGeometry args={[0.36, 0.28, 0.6, 20]} />
      </mesh>
      <mesh position={[0, 0.6, 0]} material={mats.gold}>
        <torusGeometry args={[0.36, 0.03, 8, 24]} />
      </mesh>
      <group position={[0, 0.55, 0]}>
        <ProceduralTrinitaria position={[0, 0, 0]} bloomColor={bloomColor} scale={0.55} />
      </group>
    </group>
  )
})

/** Bloom colors for {@link RESTORED_PLANTERS}, in order. */
const PLANTER_BLOOMS = ['#d82a7a', '#ff6a1a', '#a52ad8', '#d82a3a'] as const

/**
 * Props for {@link RestoredLibrary}.
 */
interface RestoredLibraryProps {
  /** Whether the displayed pages can be picked up with the crosshair. */
  pagesInteractive: boolean
  /** Page under the crosshair, if any. */
  focusedPageId: string | null
  /** Reports the page under the crosshair as it changes. */
  onPageFocus: (id: string | null) => void
}

/**
 * The library as the returned Libro de Rosa leaves it: the same hall and the
 * same floor plan, but cared for — warm plaster and wood paneling instead of
 * cracked cyber panels, polished shelving stocked end to end, the toppled row
 * cleared into a reading corner, a parquet floor under rugs, chandeliers and a
 * skylight pouring down where the pedestal used to stand, and an arch on the
 * back wall framing the alcove where the portal to the future opens. Six
 * display tables ring the skylight, each with a page of the Libro de Rosa
 * floating over it (see `BookPageDisplays`).
 *
 * @param props - Page display interaction
 * @returns Restored hall group (geometry and its own lighting)
 */
export const RestoredLibrary = memo(function RestoredLibrary({ pagesInteractive, focusedPageId, onPageFocus }: RestoredLibraryProps) {
  const parquet = useMemo(() => {
    const tex = createParquetTexture(2050)
    tex.repeat.set(5, 5)
    return tex
  }, [])
  const beamRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!beamRef.current) return
    const mat = beamRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.09 + Math.sin(clock.elapsedTime * 0.7) * 0.025
  })

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
        <meshStandardMaterial map={parquet} roughness={0.55} metalness={0.05} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]} material={mats.rug} receiveShadow>
        <circleGeometry args={[2.7, 64]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.014, 0]} material={mats.gold}>
        <ringGeometry args={[2.45, 2.58, 64]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.014, 0]} material={mats.rugInner}>
        <circleGeometry args={[1.6, 48]} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, (i / 8) * Math.PI]} position={[0, 0.016, 0]} material={mats.gold}>
          <planeGeometry args={[0.06, 3]} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.011, 6.6]} material={mats.rug} receiveShadow>
        <planeGeometry args={[1.8, 7.6]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.011, -6.4]} material={mats.rug} receiveShadow>
        <planeGeometry args={[1.8, 7.2]} />
      </mesh>

      {WALL_RUNS.map((run) => (
        <PanelledWall key={`${run.position[0]}-${run.position[1]}`} {...run} />
      ))}
      <mesh position={[0, 4.2, HALF]} material={mats.plaster}>
        <boxGeometry args={[5, 1.8, 0.45]} />
      </mesh>
      <mesh position={[0, 3.35, HALF - 0.28]} material={mats.gold}>
        <boxGeometry args={[4.2, 0.12, 0.08]} />
      </mesh>
      <PortalArch />

      <mesh rotation-x={Math.PI / 2} position={[0, CEILING_Y, 0]} material={mats.ceiling}>
        <planeGeometry args={[HALF * 2, HALF * 2]} />
      </mesh>
      {[-7.3, -3.65, 3.65, 7.3].map((c) => (
        <group key={c}>
          <mesh position={[0, CEILING_Y - 0.1, c]} material={mats.darkWood}>
            <boxGeometry args={[HALF * 2, 0.2, 0.22]} />
          </mesh>
          <mesh position={[c, CEILING_Y - 0.1, 0]} material={mats.darkWood}>
            <boxGeometry args={[0.22, 0.2, HALF * 2]} />
          </mesh>
        </group>
      ))}
      <mesh rotation-x={Math.PI / 2} position={[0, CEILING_Y - 0.02, 0]} material={mats.skylight}>
        <planeGeometry args={[4.6, 4.6]} />
      </mesh>
      <mesh position={[0, CEILING_Y - 0.05, 0]} material={mats.gold}>
        <boxGeometry args={[4.9, 0.1, 4.9]} />
      </mesh>
      <mesh ref={beamRef} position={[0, CEILING_Y / 2, 0]} userData={{ ownsOpacity: true }}>
        <cylinderGeometry args={[2.1, 2.9, CEILING_Y, 32, 1, true]} />
        <meshBasicMaterial color="#fff1c8" transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {[...WALL_SHELVES, ...AISLE_SHELVES].map((shelf) => (
        <Bookshelf
          key={`restored-shelf-${shelf.position[0]}-${shelf.position[1]}`}
          position={[shelf.position[0], SHELF_HEIGHT / 2, shelf.position[1]]}
          rotationY={shelf.rotationY}
          width={shelf.width}
          restored
        />
      ))}

      {RESTORED_READING_TABLES.map((table) => (
        <group key={`restored-table-${table.position[0]}-${table.position[1]}`}>
          <ReadingTable position={table.position} rotationY={table.rotationY} />
          <group position={[table.position[0], TABLE_TOP_Y + 0.04, table.position[1]]} rotation-y={table.rotationY}>
            <mesh position={[0, 0.16, 0]} material={mats.gold}>
              <cylinderGeometry args={[0.015, 0.015, 0.32, 6]} />
            </mesh>
            <mesh position={[0, 0.34, 0]} rotation-z={Math.PI / 2} material={mats.lampShade}>
              <cylinderGeometry args={[0.1, 0.1, 0.42, 16, 1, false, 0, Math.PI]} />
            </mesh>
          </group>
        </group>
      ))}

      {RESTORED_PLANTERS.map((p, i) => (
        <Planter key={`planter-${p[0]}-${p[1]}`} position={p} bloomColor={PLANTER_BLOOMS[i % PLANTER_BLOOMS.length]} />
      ))}

      {SECTION_SIGNS.map((sign) => (
        <SectionSign key={sign.label} position={sign.position} rotationY={sign.rotationY} label={sign.label} ceilingY={CEILING_Y} />
      ))}

      <BookPageDisplays interactive={pagesInteractive} focusedPageId={focusedPageId} onFocusChange={onPageFocus} />

      <Chandelier position={[0, 5.2]} radius={0.7} intensity={3.4} />
      <Chandelier position={[0, -5.2]} radius={0.7} intensity={3.4} />
      <Chandelier position={[-3.8, 0]} />
      <Chandelier position={[3.8, 0]} />

      <Sparkles count={140} scale={[20, 4.6, 20]} position={[0, 2.4, 0]} size={2.6} speed={0.22} color="#ffe2a0" opacity={0.55} />

      <ambientLight intensity={0.6} color="#ffe2b8" />
      <hemisphereLight args={['#fff1d6', '#5a3218', 0.7]} />
      <spotLight position={[0, CEILING_Y - 0.1, 0]} angle={0.62} penumbra={0.8} intensity={6} color="#fff4dc" distance={12} decay={1.6} />
    </group>
  )
})
