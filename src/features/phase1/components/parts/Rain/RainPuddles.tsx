import { memo, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { createPuddleMaskTexture } from '@/shared/utils/textures'

/**
 * Props for {@link RainPuddles}.
 */
interface RainPuddlesProps {
  /** Current rain strength `[0,1]`, eased by `PhaseRain`. */
  intensity: MutableRefObject<number>
  /** Whether puddles mirror the scene (costly) or are just glossy wet patches. */
  reflections: boolean
}

/**
 * The town's walkable ground, as `[minX, maxX, minZ, maxZ]` — stops short of
 * the Magdalena's banks so no puddle ever hangs over the sunken river.
 */
const TOWN_AREA = [-80, 60, -93, 93] as const
/** How many times the puddle mask repeats across the town, per axis. */
const MASK_REPEAT: [number, number] = [8, 11]
/** Height the puddle sheet floats at, just over the packed-earth ground. */
const SHEET_Y = 0.03

/**
 * Rain pooling on the ground: one sheet over the whole town, masked into
 * scattered puddles that fill up as the rain builds. With reflections on, the
 * puddles mirror the houses, trees and sky (blurred like rippling water);
 * without, they are glossy dark patches catching the light.
 *
 * @param props - Live intensity and reflection mode
 * @returns Puddle sheet
 */
export const RainPuddles = memo(function RainPuddles({ intensity, reflections }: RainPuddlesProps) {
  const matRef = useRef<THREE.Material>(null)
  const mask = useMemo(() => {
    const tex = createPuddleMaskTexture(1857)
    tex.repeat.set(MASK_REPEAT[0], MASK_REPEAT[1])
    return tex
  }, [])
  const [minX, maxX, minZ, maxZ] = TOWN_AREA

  useFrame(() => {
    if (matRef.current) matRef.current.opacity = THREE.MathUtils.smoothstep(intensity.current, 0.15, 1) * 0.85
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position={[(minX + maxX) / 2, SHEET_Y, (minZ + maxZ) / 2]} renderOrder={1}>
      <planeGeometry args={[maxX - minX, maxZ - minZ]} />
      {reflections ? (
        <MeshReflectorMaterial
          ref={matRef as never}
          alphaMap={mask}
          transparent
          opacity={0}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          resolution={512}
          blur={[320, 90]}
          mixBlur={0.9}
          mixStrength={1.6}
          mirror={0.85}
          depthScale={0}
          color="#8fa4b6"
          roughness={0.35}
          metalness={0.25}
        />
      ) : (
        <meshStandardMaterial
          ref={matRef as never}
          alphaMap={mask}
          transparent
          opacity={0}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          color="#4a5560"
          roughness={0.08}
          metalness={0.6}
        />
      )}
    </mesh>
  )
})
