/**
 * `logo-tower` entity renderer for the `cityIntro` scene — a skyscraper
 * topped with a tall, backlit riwi banner on both its front and back faces
 * so it reads clearly from either direction along the walk.
 * @module features/cityIntro/renderers/LogoTowerRenderer
 */

import { Suspense, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import type { Texture } from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { createWindowGridTexture } from '@/shared/utils/textures'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { resolvePublicSrc, RIWI_LOGO_SRC } from '@/shared/utils/media'
import type { EntityRendererProps } from '@/engine/types'

/** Intrinsic aspect ratio (height/width) of `public/images/riwi-logo.svg`. */
const LOGO_ASPECT = 70.793 / 246.192

/** One backlit banner face; mirrored on the tower's front (`+z`) and back (`-z`). */
function LogoBanner({ z, plateWidth, plateHeight, logoWidth, logoHeight, logoTexture }: { z: number; plateWidth: number; plateHeight: number; logoWidth: number; logoHeight: number; logoTexture: Texture }) {
  return (
    <group position={[0, plateHeight / 2 + 0.4, z]} rotation-y={z > 0 ? 0 : Math.PI}>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[plateWidth, plateHeight]} />
        <meshStandardMaterial color="#0c1420" emissive="#132038" emissiveIntensity={0.6} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[logoWidth, logoHeight]} />
        <meshBasicMaterial map={logoTexture} transparent toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Loads the banner logo texture; isolated so `Suspense` only guards this bit. */
function LogoBanners({ src, depth }: { src: string; depth: number }) {
  const logoTexture = useTexture(src)
  const logoWidth = 5.4
  const logoHeight = logoWidth * LOGO_ASPECT
  const plateWidth = logoWidth + 1.4
  const plateHeight = logoHeight + 1.4
  return (
    <>
      <LogoBanner z={depth / 2 + 0.03} plateWidth={plateWidth} plateHeight={plateHeight} logoWidth={logoWidth} logoHeight={logoHeight} logoTexture={logoTexture} />
      <LogoBanner z={-depth / 2 - 0.03} plateWidth={plateWidth} plateHeight={plateHeight} logoWidth={logoWidth} logoHeight={logoHeight} logoTexture={logoTexture} />
    </>
  )
}

/**
 * Boxy tower like `ProceduralSkyscraper` but topped with a tall, backlit
 * banner (front and back) showing the entity's `imageSrc` logo, defaulting
 * to the riwi mark.
 * @param props - Entity props
 * @returns Renderer element
 */
export function LogoTowerRenderer({ entity }: EntityRendererProps) {
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const { width, depth, towerHeight } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return { width: 6 + rand() * 2, depth: 5 + rand() * 1.6, towerHeight: 10 + rand() * 6 }
  }, [seed])
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
          <group position={[0, towerHeight, 0]}>
            <Suspense fallback={null}>
              <LogoBanners src={logoSrc} depth={depth} />
            </Suspense>
          </group>
          <pointLight position={[0, towerHeight + 3, depth / 2 + 1.2]} intensity={0.7} distance={7} color="#7ad8ff" decay={2} />
        </group>
      }
    />
  )
}
