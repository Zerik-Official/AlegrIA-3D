/**
 * RIWI's astronaut fox dancing on the concert stage
 * @module features/cityIntro/renderers/concert/RiwiFoxDancer
 */

import { memo, Suspense, useEffect, useMemo, useRef } from 'react'
import { useAnimations, useFBX } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { CARNIVAL_BPM } from '@/features/cityIntro/config/carnivalLayout'

/** Assumed tempo of the Mixamo dance clip, used to retime it to the party. */
const CLIP_BPM = 120

/**
 * Props for {@link RiwiFoxDancer}.
 */
interface RiwiFoxDancerProps {
  /** Height the fox is scaled to, in scene units. */
  height: number
}

/**
 * @param props - Target height
 * @returns Animated fox, feet on its origin
 */
function FoxModel({ height }: RiwiFoxDancerProps) {
  const fbx = useFBX(modelRegistry['cityIntro/riwi-fox'].path) as unknown as THREE.Group & {
    animations: THREE.AnimationClip[]
  }
  const rigRef = useRef<THREE.Group>(null)

  const { model, scale, offset } = useMemo(() => {
    fbx.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) mesh.castShadow = true
    })
    fbx.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(fbx)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = size.y > 0 ? height / size.y : 1
    return { model: fbx, scale: s, offset: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number] }
  }, [fbx, height])

  const { actions } = useAnimations(fbx.animations, rigRef)

  useEffect(() => {
    const action = Object.values(actions)[0]
    action?.reset().setLoop(THREE.LoopRepeat, Infinity).setEffectiveTimeScale(CARNIVAL_BPM / CLIP_BPM).play()
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
 * @param props - Target height
 * @returns Fox, or a placeholder while it loads
 */
export const RiwiFoxDancer = memo(function RiwiFoxDancer({ height }: RiwiFoxDancerProps) {
  return (
    <Suspense
      fallback={
        <mesh position={[0, height / 2, 0]}>
          <capsuleGeometry args={[0.4, height - 0.8, 4, 8]} />
          <meshStandardMaterial color="#ff7a00" roughness={0.7} />
        </mesh>
      }
    >
      <FoxModel height={height} />
    </Suspense>
  )
})
