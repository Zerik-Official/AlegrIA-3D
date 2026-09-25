/**
 * The hover bus parked by the curb, playing an ad video on its side screen
 * with the video's own sound, heard louder the closer the player is.
 * @module features/cityIntro/renderers/AdBusRenderer
 */

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { resolvePublicSrc } from '@/shared/utils/media'
import { useSpatialVideoTexture } from '@/shared/hooks/useSpatialVideoTexture'
import { narrationState } from '@/shared/audio/narrationState'
import type { EntityRendererProps } from '@/engine/types'

/** Material the Blender script names the screen with — its map is replaced by the video. */
const SCREEN_MATERIAL = 'PantallaVideo'
/** Within this distance the video plays at full volume. */
const NEAR = 5
/** Beyond this distance it can't be heard at all. */
const FAR = 32
/** Loudest the video gets. */
const MAX_VOLUME = 0.7
/** Share of its volume left while the narrator speaks, so it never talks over them. */
const NARRATION_DUCK = 0.2
/** How quickly the volume follows its target. */
const VOLUME_DAMPING = 3

/** Reused vector so the volume update allocates nothing per frame. */
const scratch = new THREE.Vector3()

/**
 * The bus model with its screen showing the video, and the video's sound
 * following the listener's distance (ducked under the narration). The model
 * shows the screen on its local `+X` side; the entity's `rotationY` turns it
 * towards the street.
 * @param props - Video URL
 * @returns Bus group
 */
function AdBus({ videoSrc }: { videoSrc: string | undefined }) {
  const { scene } = useGLTF(modelRegistry['cityIntro/ad-bus'].path) as unknown as { scene: THREE.Group }
  const spatial = useSpatialVideoTexture(videoSrc)
  const groupRef = useRef<THREE.Group>(null)
  const volume = useRef(0)

  const screenMaterial = useMemo(() => {
    if (!spatial) return null
    spatial.texture.flipY = false
    return new THREE.MeshBasicMaterial({ map: spatial.texture, toneMapped: false })
  }, [spatial])

  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = false
    })
    return c
  }, [scene])

  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material)) return
      if (mesh.material.name === SCREEN_MATERIAL && screenMaterial) mesh.material = screenMaterial
    })
  }, [cloned, screenMaterial])

  useEffect(() => () => screenMaterial?.dispose(), [screenMaterial])

  useFrame(({ camera }, delta) => {
    const video = spatial?.video
    const group = groupRef.current
    if (!video || !group) return
    group.getWorldPosition(scratch)
    const distance = scratch.distanceTo(camera.position)
    const falloff = 1 - THREE.MathUtils.smoothstep(distance, NEAR, FAR)
    const target = falloff * MAX_VOLUME * (narrationState.speaking ? NARRATION_DUCK : 1)
    volume.current = THREE.MathUtils.damp(volume.current, target, VOLUME_DAMPING, Math.min(delta, 0.05))
    video.volume = THREE.MathUtils.clamp(volume.current, 0, 1)
    const audible = volume.current > 0.005
    if (video.muted === audible) video.muted = !audible
    if (video.paused && video.readyState >= 2) video.play().catch(() => {})
  })

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  )
}

/**
 * @param props - Entity props (`videoSrc` is the looping ad)
 * @returns Renderer element
 */
export function AdBusRenderer({ entity }: EntityRendererProps) {
  return (
    <Suspense fallback={null}>
      <AdBus videoSrc={resolvePublicSrc(entity.videoSrc)} />
    </Suspense>
  )
}
