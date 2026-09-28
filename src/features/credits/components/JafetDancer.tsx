/**
 * Jafet, dancing with one of the `credits/animated` `.fbx` clips on loop —
 * picked at random and swapped for another every time the credits music
 * loops — with his name floating over his head, plus the occasional "Chicos,
 * silencio porfaa" popping up beside him. Driven by a `jafet-dancer` entity
 * so the editor can move, rotate and resize him like any other element.
 * @module features/credits/components/JafetDancer
 */

import { memo, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useAnimations, useFBX } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { onAudioLoop } from '@/shared/audio/audioAnalyser'
import { NameTag } from '@/features/credits/components/NameTag'
import { SilenceShout } from '@/features/credits/components/SilenceShout'
import { CREDITS_DANCER_NAME } from '@/features/credits/config/creditsConfig'
import type { EntityRendererProps } from '@/engine/types'

/** Height Jafet is scaled to, in scene units (meters). */
const DANCER_HEIGHT = 1.8
/** Height over Jafet's head the name tag floats at. */
const NAME_TAG_Y = DANCER_HEIGHT + 0.45

/** Dancer variants, one `.fbx` each. */
const DANCER_KEYS = ['credits/dancers/break-dance', 'credits/dancers/flair', 'credits/dancers/hip-hop', 'credits/dancers/hip-hop-2']

/**
 * Picks a random dancer other than the current one.
 * @param except - Key to exclude
 * @returns Another dancer key
 */
function randomDancer(except: string): string {
  const pool = DANCER_KEYS.filter((key) => key !== except)
  return pool[Math.floor(Math.random() * pool.length)] ?? DANCER_KEYS[0]
}

/**
 * The rigged `.fbx` model, normalized to {@link DANCER_HEIGHT} with its feet
 * on the floor and centered on its origin, playing its first clip on loop.
 * Mixamo exports come at an arbitrary unit scale, so the model is measured
 * rather than trusted.
 * @param props - Registry path of the `.fbx` to dance with
 * @returns Animated model
 */
function FbxDancerModel({ src }: { src: string }) {
  const fbx = useFBX(src) as unknown as THREE.Group & { animations: THREE.AnimationClip[] }
  const rigRef = useRef<THREE.Group>(null)

  const { model, scale, offset } = useMemo(() => {
    fbx.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.frustumCulled = false
    })
    fbx.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(fbx)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = size.y > 0 ? DANCER_HEIGHT / size.y : 1
    return { model: fbx, scale: s, offset: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number] }
  }, [fbx])

  const { actions } = useAnimations(fbx.animations, rigRef)

  useEffect(() => {
    const action = Object.values(actions)[0]
    action?.reset().setLoop(THREE.LoopRepeat, Infinity).play()
    return () => {
      action?.stop()
    }
  }, [actions])

  return (
    <group position={offset} scale={scale}>
      <group ref={rigRef}>
        <primitive object={model} />
      </group>
    </group>
  )
}

/**
 * Shown while the model loads, or when it's missing.
 * @returns Placeholder capsule
 */
function DancerFallback() {
  return (
    <mesh position={[0, DANCER_HEIGHT / 2, 0]} castShadow>
      <capsuleGeometry args={[0.3, DANCER_HEIGHT - 0.6, 4, 8]} />
      <meshStandardMaterial color="#e8dfc8" roughness={0.85} />
    </mesh>
  )
}

export const JafetDancerRenderer = memo(function JafetDancerRenderer(_props: EntityRendererProps) {
  const [dancerKey, setDancerKey] = useState<string>(() => randomDancer(''))

  useEffect(() => {
    const registry = modelRegistry as unknown as Record<string, { path: string }>
    for (const key of DANCER_KEYS) useFBX.preload(registry[key].path)
  }, [])

  useEffect(() => onAudioLoop('phase', () => setDancerKey((current) => randomDancer(current))), [])

  const src = (modelRegistry as unknown as Record<string, { path: string }>)[dancerKey].path

  return (
    <group>
      <Suspense fallback={<DancerFallback />}>
        <FbxDancerModel key={dancerKey} src={src} />
      </Suspense>
      <NameTag text={CREDITS_DANCER_NAME} position={[0, NAME_TAG_Y, 0]} />
      <Suspense fallback={null}>
        <SilenceShout position={[1.25, DANCER_HEIGHT * 0.95, 0]} />
      </Suspense>
    </group>
  )
})
