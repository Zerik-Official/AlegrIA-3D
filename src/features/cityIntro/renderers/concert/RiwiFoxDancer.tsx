/**
 * RIWI's astronaut fox dancing on the concert stage, playing the dance clip
 * baked in `riwi-fox-dancing.py` on loop, retimed to the street party's tempo.
 * @module features/cityIntro/renderers/concert/RiwiFoxDancer
 */

import { memo, Suspense, useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { CARNIVAL_BPM } from '@/features/cityIntro/config/carnivalLayout'

/** Tempo the dance clip was authored at (`riwi-fox-dancing.py`: a beat every 12 frames at 24 fps). */
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
  const { scene, animations } = useGLTF(modelRegistry['cityIntro/riwi-fox'].path) as unknown as {
    scene: THREE.Group
    animations: THREE.AnimationClip[]
  }
  const rigRef = useRef<THREE.Group>(null)

  const { model, scale, offset } = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) mesh.castShadow = true
    })
    c.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = size.y > 0 ? height / size.y : 1
    return { model: c, scale: s, offset: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number] }
  }, [scene, height])

  const { actions } = useAnimations(animations, rigRef)

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
