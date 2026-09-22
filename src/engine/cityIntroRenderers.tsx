/**
 * Entity renderers for the `cityIntro` scene (futuristic street, skyscrapers,
 * flying traffic, moon, and the abandoned library facade). Kept in its own
 * module and merged into `engine/entityRegistry`'s map, so that registry file
 * doesn't grow unbounded as more scenes get their own JSON-driven dressing.
 * @module engine/cityIntroRenderers
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createWindowGridTexture } from '@/shared/utils/textures'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import type { EntityRenderer, EntityRendererProps } from '@/engine/types'

function SkyscraperRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#3a4a6a'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const { width, depth, height, hasBeacon } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return {
      width: 3.0 + rand() * 2.6,
      depth: 2.8 + rand() * 2.4,
      height: 14 + rand() * 24,
      hasBeacon: rand() > 0.4,
    }
  }, [seed])
  const windowTexture = useMemo(() => createWindowGridTexture(seed, 5, Math.round(height * 1.4)), [seed, height])

  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2 + 0.01]}>
        <planeGeometry args={[width * 0.92, height * 0.94]} />
        <meshBasicMaterial map={windowTexture} transparent />
      </mesh>
      <mesh position={[0, height / 2, -depth / 2 - 0.01]} rotation-y={Math.PI}>
        <planeGeometry args={[width * 0.92, height * 0.94]} />
        <meshBasicMaterial map={windowTexture} transparent />
      </mesh>
      <mesh position={[width / 2 + 0.01, height / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[depth * 0.92, height * 0.94]} />
        <meshBasicMaterial map={windowTexture} transparent />
      </mesh>
      <mesh position={[-width / 2 - 0.01, height / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[depth * 0.92, height * 0.94]} />
        <meshBasicMaterial map={windowTexture} transparent />
      </mesh>
      {hasBeacon && (
        <>
          <mesh position={[0, height + 0.8, 0]}>
            <cylinderGeometry args={[0.035, 0.05, 1.6, 6]} />
            <meshStandardMaterial color="#2a2e38" roughness={0.6} metalness={0.7} />
          </mesh>
          <mesh position={[0, height + 1.65, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#ff3355" />
          </mesh>
          <pointLight position={[0, height + 1.65, 0]} intensity={0.8} distance={4} color="#ff3355" decay={2} />
        </>
      )}
    </group>
  )
}

function StreetlightRenderer() {
  return (
    <group>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 3.2, 8]} />
        <meshStandardMaterial color="#161a20" roughness={0.55} metalness={0.65} />
      </mesh>
      <mesh position={[0, 3.15, 0.26]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.032, 0.032, 0.56, 6]} />
        <meshStandardMaterial color="#161a20" roughness={0.55} metalness={0.65} />
      </mesh>
      <mesh position={[0, 3.02, 0.52]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#ffe9b0" emissive="#ffcf6b" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0, 3.02, 0.52]}>
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshBasicMaterial color="#ffcf6b" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight position={[0, 3.0, 0.52]} intensity={1.15} distance={6.5} color="#ffcf6b" decay={2} />
    </group>
  )
}

function FlyingCarRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#ff6a3a'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const groupRef = useRef<THREE.Group>(null)
  const { radiusX, radiusZ, speed, phase } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return { radiusX: 3.5 + rand() * 3.5, radiusZ: 2 + rand() * 2.5, speed: 0.18 + rand() * 0.22, phase: rand() * Math.PI * 2 }
  }, [seed])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime * speed + phase
    groupRef.current.position.set(Math.cos(t) * radiusX, Math.sin(t * 1.7) * 0.7, Math.sin(t) * radiusZ)
    groupRef.current.rotation.y = -t + Math.PI / 2
  })

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.56, 4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.42, 0.025, 0.16]} />
        <meshBasicMaterial color="#8fe8ff" transparent opacity={0.85} />
      </mesh>
      <pointLight intensity={0.55} distance={2.6} color={color} decay={2} />
    </group>
  )
}

function FlyingTrainRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#7ad8ff'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const groupRef = useRef<THREE.Group>(null)
  const { range, speed } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return { range: 12 + rand() * 10, speed: 0.06 + rand() * 0.05 }
  }, [seed])
  const carCount = 4

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime * speed + seed
    groupRef.current.position.x = Math.sin(t) * range
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.35, 0]}>
        <planeGeometry args={[range * 2 + 2, 0.18]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {Array.from({ length: carCount }).map((_, i) => (
        <mesh key={i} position={[i * 1.35 - ((carCount - 1) * 1.35) / 2, 0, 0]} castShadow>
          <boxGeometry args={[1.15, 0.48, 0.58]} />
          <meshStandardMaterial color={i === 0 ? color : '#1a2230'} emissive={color} emissiveIntensity={i === 0 ? 0.55 : 0.18} metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
      <pointLight intensity={0.75} distance={5} color={color} decay={2} />
    </group>
  )
}

function MoonRenderer() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[4, 24, 24]} />
        <meshStandardMaterial color="#e8e4d8" emissive="#e8e4d8" emissiveIntensity={0.42} roughness={1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4.7, 20, 20]} />
        <meshBasicMaterial color="#cfe0ff" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[5.6, 16, 16]} />
        <meshBasicMaterial color="#cfe0ff" transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <directionalLight intensity={0.38} color="#cfe0ff" />
    </group>
  )
}

function LibraryFacadeRenderer() {
  const glowRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!glowRef.current) return
    const mat = glowRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.32 + Math.sin(clock.elapsedTime * 0.6) * 0.1
  })

  return (
    <group>
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 9, 8]} />
        <meshStandardMaterial color="#1c2230" roughness={0.92} />
      </mesh>
      {[-4.2, -1.4, 1.4, 4.2].map((x) => (
        <mesh key={x} position={[x, 3.2, 4.05]} castShadow>
          <cylinderGeometry args={[0.3, 0.34, 6.2, 10]} />
          <meshStandardMaterial color="#2a3040" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 9.3, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[8.2, 2.4, 4]} />
        <meshStandardMaterial color="#12161e" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.6, 4.08]}>
        <planeGeometry args={[1.8, 3.2]} />
        <meshStandardMaterial color="#05060a" roughness={1} />
      </mesh>
      <mesh ref={glowRef} position={[0, 1.6, 4.1]}>
        <planeGeometry args={[1.6, 3.0]} />
        <meshStandardMaterial color="#0a0f1a" emissive="#ff8a1a" emissiveIntensity={0.32} transparent opacity={0.85} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.15 * i + 0.08, 4.5 + i * 0.5]} receiveShadow>
          <boxGeometry args={[6 - i * 0.6, 0.16, 0.5]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
        </mesh>
      ))}
      {[-4.6, -1.6, 1.6, 4.6].map((x) => (
        <group key={x} position={[x, 6.0, 4.06]}>
          <mesh>
            <planeGeometry args={[1.1, 1.6]} />
            <meshStandardMaterial color="#0a0d14" roughness={1} />
          </mesh>
          <mesh position={[0, 0, 0.01]} rotation-z={0.15}>
            <boxGeometry args={[1.3, 0.08, 0.02]} />
            <meshStandardMaterial color="#4a3420" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.01]} rotation-z={-0.2}>
            <boxGeometry args={[1.3, 0.08, 0.02]} />
            <meshStandardMaterial color="#4a3420" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 7.9, 4.02]}>
        <boxGeometry args={[5.4, 0.7, 0.12]} />
        <meshStandardMaterial color="#0a0d14" roughness={0.9} />
      </mesh>
      <pointLight position={[0, 1.8, 5.4]} intensity={1.6} distance={7} color="#ff8a1a" decay={2} />
    </group>
  )
}

function PathPointRenderer() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = 0.15 + Math.sin(clock.elapsedTime * 1.4 + ref.current.position.x) * 0.05
  })
  return (
    <mesh ref={ref} position={[0, 0.15, 0]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color="#ffcc33" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

/**
 * Renderer map for the `cityIntro` scene's entity types — merged into
 * `engine/entityRegistry`'s `entityRegistry` export.
 */
export const cityIntroRenderers: Record<string, EntityRenderer> = {
  skyscraper: SkyscraperRenderer,
  streetlight: StreetlightRenderer,
  'flying-car': FlyingCarRenderer,
  'flying-train': FlyingTrainRenderer,
  moon: MoonRenderer,
  'library-facade': LibraryFacadeRenderer,
  'path-point': PathPointRenderer,
}
