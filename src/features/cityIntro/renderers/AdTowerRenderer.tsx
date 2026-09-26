/**
 * `ad-tower` entity renderer for the `cityIntro` scene — a lit, window-clad
 * tower (like `SkyscraperRenderer`) whose street-facing side carries a big
 * screen playing a looped, muted, autoplaying video when the entity sets
 * `videoSrc`, or a generated neon ad pattern otherwise, plus a scrolling
 * ticker band underneath for extra skyline life.
 * @module features/cityIntro/renderers/AdTowerRenderer
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { createAdScreenTexture, createWindowGridTexture } from '@/shared/utils/textures'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { resolvePublicSrc, resolvePublicSrcs } from '@/shared/utils/media'
import { useVideoPlaylistTexture, resolvePlaylist } from '@/shared/hooks/useVideoPlaylistTexture'
import type { EntityRendererProps } from '@/engine/types'

/** Plays the entity's video playlist as a screen texture. */
function VideoScreen({ texture, width, height }: { texture: THREE.VideoTexture; width: number; height: number }) {
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
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    const map = (meshRef.current?.material as THREE.MeshBasicMaterial | undefined)?.map
    if (map) map.offset.x += delta * 0.05
  })
  return (
    <mesh ref={meshRef} position={[0, 0, 0.02]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/** Thin scrolling ticker band shown under the main screen, always procedural. */
function TickerBand({ width, seed }: { width: number; seed: number }) {
  const texture = useMemo(() => createAdScreenTexture(seed + 1, 10, 2), [seed])
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    const map = (meshRef.current?.material as THREE.MeshBasicMaterial | undefined)?.map
    if (map) map.offset.x += delta * 0.18
  })
  return (
    <mesh ref={meshRef} position={[0, 0, 0.02]}>
      <planeGeometry args={[width, 0.7]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/**
 * Boxy, window-lit tower like `ProceduralSkyscraper`, but its street-facing
 * side (resolved from which side of the road the entity's `position.x` puts
 * it on) carries a big screen — video or generated ad pattern — with a
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
  const roadSign = entity.position[0] > 0 ? -1 : 1
  const screenY = height * 0.58
  const screenHeight = height * 0.5
  const screenSpan = depth * 0.82
  const windowTexture = useMemo(() => createWindowGridTexture(seed, 5, Math.round(height * 1.4)), [seed, height])
  const playlist = useMemo(
    () => resolvePlaylist(resolvePublicSrc(entity.videoSrc), resolvePublicSrcs(entity.videoSrcs)),
    [entity.videoSrc, entity.videoSrcs]
  )
  const videoTexture = useVideoPlaylistTexture(playlist)
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
          <mesh position={[0, height / 2, depth / 2 + 0.01]}>
            <planeGeometry args={[width * 0.92, height * 0.9]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[0, height / 2, -depth / 2 - 0.01]} rotation-y={Math.PI}>
            <planeGeometry args={[width * 0.92, height * 0.9]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[-roadSign * (width / 2 + 0.01), height / 2, 0]} rotation-y={-roadSign * (Math.PI / 2)}>
            <planeGeometry args={[depth * 0.92, height * 0.9]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>

          <group position={[roadSign * (width / 2 + 0.03), screenY, 0]} rotation-y={roadSign * (Math.PI / 2)}>
            {videoTexture ? (
              <VideoScreen texture={videoTexture} width={screenSpan} height={screenHeight} />
            ) : (
              <ProceduralScreen width={screenSpan} height={screenHeight} seed={seed} />
            )}
            <group position={[0, screenHeight / 2 + 0.55, 0]}>
              <TickerBand width={screenSpan} seed={seed} />
            </group>
          </group>

          <pointLight ref={rimRef} position={[roadSign * (width / 2 + 1.4), screenY, 0]} intensity={0.9} distance={8} color={accent} decay={2} />
        </group>
      }
    />
  )
}
