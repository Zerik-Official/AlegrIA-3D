/**
 * Jafet, dancing at the credits scene's center with his `.glb`'s own dance
 * clip on loop and his name floating over his head, plus the occasional
 * "Chicos, silencio porfaa" popping up beside him.
 * @module features/credits/components/JafetDancer
 */

import { memo, Suspense, useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { modelRegistry } from '@/shared/config/models'
import { NameTag } from '@/features/credits/components/NameTag'
import { SilenceShout } from '@/features/credits/components/SilenceShout'
import { CREDITS_CENTER, CREDITS_DANCER_NAME } from '@/features/credits/config/creditsConfig'

/** Height Jafet is scaled to, in scene units (meters). */
const DANCER_HEIGHT = 1.8
/** Height over Jafet's head the name tag floats at. */
const NAME_TAG_Y = DANCER_HEIGHT + 0.45

/**
 * The rigged model, normalized to {@link DANCER_HEIGHT} with its feet on the
 * floor and centered on its origin, playing its first clip on loop. The
 * source is a Sketchfab export at an arbitrary unit scale, so it's measured
 * (skinned bounds, in its rest pose) rather than trusted.
 * @returns Animated model
 */
function JafetModel() {
  const { scene, animations } = useGLTF(modelRegistry['credits/jafet-futuro'].path) as unknown as {
    scene: THREE.Group
    animations: THREE.AnimationClip[]
  }
  const rigRef = useRef<THREE.Group>(null)

  const { model, scale, offset } = useMemo(() => {
    const c = cloneSkinned(scene) as THREE.Group
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.frustumCulled = false
    })
    c.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = size.y > 0 ? DANCER_HEIGHT / size.y : 1
    return { model: c, scale: s, offset: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number] }
  }, [scene])

  const { actions } = useAnimations(animations, rigRef)

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

export const JafetDancer = memo(function JafetDancer() {
  return (
    <group position={CREDITS_CENTER}>
      <Suspense fallback={<DancerFallback />}>
        <JafetModel />
      </Suspense>
      <NameTag text={CREDITS_DANCER_NAME} position={[0, NAME_TAG_Y, 0]} />
      <Suspense fallback={null}>
        <SilenceShout position={[1.25, DANCER_HEIGHT * 0.95, 0]} />
      </Suspense>
    </group>
  )
})
