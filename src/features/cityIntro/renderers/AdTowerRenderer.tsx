/**
 * `ad-tower` entity renderer for the `cityIntro` scene — a Times-Square-style
 * building whose front screen plays a looped, muted, autoplaying video when
 * the entity sets `videoSrc`, or a generated neon ad pattern otherwise, plus
 * a scrolling ticker band underneath for extra skyline life.
 * @module features/cityIntro/renderers/AdTowerRenderer
 */

import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVideoTexture } from '@react-three/drei'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { createAdScreenTexture } from '@/shared/utils/textures'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { resolvePublicSrc } from '@/shared/utils/media'
import type { EntityRendererProps } from '@/engine/types'

/** Loads and plays the entity's video as a screen texture; isolated so `Suspense` guards only this. */
function VideoScreen({ src, width, height }: { src: string; width: number; height: number }) {
  const texture = useVideoTexture(src, { muted: true, loop: true, start: true })
  return (
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/** Generated neon ad pattern, scrolled slowly via texture offset instead of a video. */
function ProceduralScreen({ width, height, seed }: { width: number; height: number; seed: number }) {
  const texture = useMemo(() => createAdScreenTexture(seed), [seed])
  useFrame((_, delta) => {
    texture.offset.x += delta * 0.05
  })
  return (
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/** Thin scrolling ticker band shown under the main screen, always procedural. */
function TickerBand({ width, seed }: { width: number; seed: number }) {
  const texture = useMemo(() => createAdScreenTexture(seed + 1, 10, 2), [seed])
  useFrame((_, delta) => {
    texture.offset.x += delta * 0.18
  })
  return (
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[width, 0.7]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/**
 * Boxy tower with a big front screen (video or generated ad pattern) and a
 * ticker strip above it, reading as a Times-Square-style digital billboard.
 * @param props - Entity props
 * @returns Renderer element
 */
export function AdTowerRenderer({ entity }: EntityRendererProps) {
  const accent = entity.variant ?? '#ff2a6d'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const { width, depth, height } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return { width: 5 + rand() * 2.4, depth: 4 + rand() * 2, height: 16 + rand() * 14 }
  }, [seed])
  const screenWidth = width * 0.82
  const screenHeight = height * 0.5
  const screenY = height * 0.58
  const videoSrc = useMemo(() => resolvePublicSrc(entity.videoSrc), [entity.videoSrc])
  const rimRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (rimRef.current) rimRef.current.intensity = 0.75 + Math.sin(clock.elapsedTime * 2.4 + seed) * 0.25
  })

  return (
    <ModelLoader
      src={modelRegistry['cityIntro/ad-tower'].path}
      fallback={
        <group>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#12131c" roughness={0.6} metalness={0.3} />
          </mesh>
          <group position={[0, screenY, depth / 2 + 0.03]}>
            {videoSrc ? (
              <Suspense fallback={<ProceduralScreen width={screenWidth} height={screenHeight} seed={seed} />}>
                <VideoScreen src={videoSrc} width={screenWidth} height={screenHeight} />
              </Suspense>
            ) : (
              <ProceduralScreen width={screenWidth} height={screenHeight} seed={seed} />
            )}
            <group position={[0, screenHeight / 2 + 0.55, 0]}>
              <TickerBand width={screenWidth} seed={seed} />
            </group>
          </group>
          <pointLight ref={rimRef} position={[0, screenY, depth / 2 + 1.4]} intensity={0.9} distance={8} color={accent} decay={2} />
        </group>
      }
    />
  )
}
