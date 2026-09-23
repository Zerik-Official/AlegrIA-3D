/**
 * `logo-tower` entity renderer for the `cityIntro` scene — a skyscraper
 * topped with a tall, backlit riwi banner rotated to face the road (resolved
 * from which side of the street the entity's `position.x` puts it on), so it
 * reads clearly from the walk instead of edge-on.
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

/** Backlit rooftop banner, rotated to face the road. */
function LogoBanner({ rotationY, plateWidth, plateHeight, logoWidth, logoHeight, logoTexture }: { rotationY: number; plateWidth: number; plateHeight: number; logoWidth: number; logoHeight: number; logoTexture: Texture }) {
  return (
    <group position={[0, plateHeight / 2 + 0.4, 0]} rotation-y={rotationY}>
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
function LogoBanners({ src, roadSign }: { src: string; roadSign: number }) {
  const logoTexture = useTexture(src)
  const logoWidth = 5.4
  const logoHeight = logoWidth * LOGO_ASPECT
  const plateWidth = logoWidth + 1.4
  const plateHeight = logoHeight + 1.4
  return <LogoBanner rotationY={roadSign * (Math.PI / 2)} plateWidth={plateWidth} plateHeight={plateHeight} logoWidth={logoWidth} logoHeight={logoHeight} logoTexture={logoTexture} />
}

/**
 * Boxy tower like `ProceduralSkyscraper` but topped with a tall, backlit
 * banner facing the road, showing the entity's `imageSrc` logo, defaulting
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
  /** +1/-1 X direction from the tower's center toward the road, based on which side of the street it sits on. */
  const roadSign = entity.position[0] > 0 ? -1 : 1
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
          <group position={[0, towerHeight, 0]}>
            <Suspense fallback={null}>
              <LogoBanners src={logoSrc} roadSign={roadSign} />
            </Suspense>
          </group>
          <pointLight position={[roadSign * (width / 2 + 1.4), towerHeight + 3, 0]} intensity={0.7} distance={7} color="#7ad8ff" decay={2} />
        </group>
      }
    />
  )
}
