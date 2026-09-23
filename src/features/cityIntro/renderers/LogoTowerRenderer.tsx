/**
 * `logo-tower` entity renderer for the `cityIntro` scene — a riwi
 * headquarters tower with a stepped crown, vertical accent light strips, a
 * vector-traced neon riwi mark (rebuilt from the SVG via `SVGLoader`, not a
 * flat texture on a backing plate) glowing on its road-facing side, and a
 * pair of ground spotlights washing it in light.
 * @module features/cityIntro/renderers/LogoTowerRenderer
 */

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useLoader } from '@react-three/fiber'
import { SVGLoader } from 'three-stdlib'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { createWindowGridTexture } from '@/shared/utils/textures'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { resolvePublicSrc, RIWI_LOGO_SRC } from '@/shared/utils/media'
import type { EntityRendererProps } from '@/engine/types'

/** `riwi-logo.svg`'s declared viewBox size, used to center and scale the traced vector shapes. */
const LOGO_VIEWBOX = { width: 246.192, height: 70.793 }
/** Neon tint for the recreated logo and its glow. */
const LOGO_NEON_COLOR = '#8a7aff'

/**
 * Traces `riwi-logo.svg` into flat `THREE.ShapeGeometry` meshes via
 * `SVGLoader` — real vector geometry instead of a flat texture — so the mark
 * can glow like neon: a bright core shape plus two soft, additive-blended
 * halo copies (scaled up around the mark's own center, which is why each
 * geometry is pre-centered before any grouping) bleeding onto the tower
 * wall behind it, lit by a matching point light. No backing plate — the
 * source mark has none.
 * @param props - Target mark width, and which side of the street to face
 * @returns Neon logo group
 */
function RiwiNeonLogo({ src, width, roadSign }: { src: string; width: number; roadSign: number }) {
  const { paths } = useLoader(SVGLoader, src)
  const geometries = useMemo(() => {
    const geoms: THREE.ShapeGeometry[] = []
    for (const path of paths) {
      for (const shape of path.toShapes()) {
        const geo = new THREE.ShapeGeometry(shape)
        geo.translate(-LOGO_VIEWBOX.width / 2, -LOGO_VIEWBOX.height / 2, 0)
        geoms.push(geo)
      }
    }
    return geoms
  }, [paths])
  const scale = width / LOGO_VIEWBOX.width

  return (
    <group rotation-y={roadSign * (Math.PI / 2)}>
      {/* SVGLoader keeps the SVG's own Y-down convention; flip Y here (the
          documented three.js fix) while sizing to `width`. */}
      <group scale={[scale, -scale, scale]}>
        <group scale={1.35} position={[0, 0, -0.08]}>
          {geometries.map((geo, i) => (
            <mesh key={`halo2-${i}`} geometry={geo}>
              <meshBasicMaterial color={LOGO_NEON_COLOR} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
        <group scale={1.14} position={[0, 0, -0.04]}>
          {geometries.map((geo, i) => (
            <mesh key={`halo1-${i}`} geometry={geo}>
              <meshBasicMaterial color={LOGO_NEON_COLOR} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
        {geometries.map((geo, i) => (
          <mesh key={`core-${i}`} geometry={geo}>
            <meshBasicMaterial color={LOGO_NEON_COLOR} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0, roadSign * 0.6]} intensity={1.4} distance={9} color={LOGO_NEON_COLOR} decay={2} />
    </group>
  )
}

/** A pair of ground floodlights flanking the tower's front/back, angled up at it. */
function GroundSpotlight({ z, aimHeight, color }: { z: number; aimHeight: number; color: string }) {
  const lightRef = useRef<THREE.SpotLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)
  useEffect(() => {
    if (lightRef.current && targetRef.current) lightRef.current.target = targetRef.current
  }, [])
  return (
    <>
      <spotLight ref={lightRef} position={[0, 0.6, z]} angle={0.5} penumbra={0.55} intensity={6} distance={40} color={color} decay={2} />
      <object3D ref={targetRef} position={[0, aimHeight, 0]} />
    </>
  )
}

/**
 * Boxy tower like `ProceduralSkyscraper`, but with a stepped crown and
 * vertical accent light strips, topped with the riwi neon mark facing the
 * road (resolved from which side of the street the entity's `position.x`
 * puts it on) and washed by a pair of ground spotlights.
 * @param props - Entity props
 * @returns Renderer element
 */
export function LogoTowerRenderer({ entity }: EntityRendererProps) {
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const { width, depth, towerHeight } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return { width: 6 + rand() * 2, depth: 5 + rand() * 1.6, towerHeight: 10 + rand() * 6 }
  }, [seed])
  /** +1/-1 X direction from the tower's center toward the road, based on which side of the street it sits on. */
  const roadSign = entity.position[0] > 0 ? -1 : 1
  const crownWidth = width * 0.6
  const crownDepth = depth * 0.6
  const crownHeight = towerHeight * 0.18
  const windowTexture = useMemo(() => createWindowGridTexture(seed, 6, Math.round(towerHeight * 1.4)), [seed, towerHeight])
  const logoSrc = useMemo(() => resolvePublicSrc(entity.imageSrc) ?? RIWI_LOGO_SRC, [entity.imageSrc])

  return (
    <ModelLoader
      src={modelRegistry['cityIntro/logo-tower'].path}
      fallback={
        <group>
          <mesh position={[0, towerHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, towerHeight, depth]} />
            <meshStandardMaterial color="#171b28" roughness={0.55} metalness={0.35} />
          </mesh>
          <mesh position={[0, towerHeight / 2, depth / 2 + 0.01]}>
            <planeGeometry args={[width * 0.92, towerHeight * 0.9]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[0, towerHeight / 2, -depth / 2 - 0.01]} rotation-y={Math.PI}>
            <planeGeometry args={[width * 0.92, towerHeight * 0.9]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[-roadSign * (width / 2 + 0.01), towerHeight / 2, 0]} rotation-y={-roadSign * (Math.PI / 2)}>
            <planeGeometry args={[depth * 0.92, towerHeight * 0.9]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>

          {/* Stepped crown, giving the tower a distinct silhouette instead of a bare box. */}
          <mesh position={[0, towerHeight + crownHeight / 2, 0]} castShadow>
            <boxGeometry args={[crownWidth, crownHeight, crownDepth]} />
            <meshStandardMaterial color="#232842" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, towerHeight + crownHeight + 0.03, 0]}>
            <boxGeometry args={[crownWidth * 1.02, 0.06, crownDepth * 1.02]} />
            <meshStandardMaterial color={LOGO_NEON_COLOR} emissive={LOGO_NEON_COLOR} emissiveIntensity={1.2} toneMapped={false} />
          </mesh>

          {/* Vertical accent light strips along the two front corners. */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (width / 2 - 0.12), towerHeight / 2, roadSign * (depth / 2 + 0.02)]}>
              <boxGeometry args={[0.1, towerHeight * 0.94, 0.05]} />
              <meshStandardMaterial color="#7ad8ff" emissive="#7ad8ff" emissiveIntensity={1.4} toneMapped={false} />
            </mesh>
          ))}

          <group position={[0, towerHeight + crownHeight + 1.6, 0]}>
            <Suspense fallback={null}>
              <RiwiNeonLogo src={logoSrc} width={5.4} roadSign={roadSign} />
            </Suspense>
          </group>

          <GroundSpotlight z={depth / 2 + 3} aimHeight={towerHeight * 0.55} color="#7ad8ff" />
          <GroundSpotlight z={-(depth / 2 + 3)} aimHeight={towerHeight * 0.55} color="#ffcf6b" />
        </group>
      }
    />
  )
}
