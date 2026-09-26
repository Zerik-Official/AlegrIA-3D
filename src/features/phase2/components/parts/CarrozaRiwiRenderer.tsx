/**
 * `parade-vehicle` renderer for the `carrosa-riwi` variant — the float's
 * laptop screen (Blender material `PantallaVideo`) plays the entity's video
 * playlist muted and on loop, its speaker bumps to an implied beat via a
 * side-to-side sway, and the whole thing drives the shared parade loop
 * (`paradeLoop`) like every other `parade-vehicle`.
 *
 * Bypasses `ModelLoader` (no material-swap or animation hooks there) the same
 * way `ScreenBuildingRenderer` and `TrenAnimado` do for their own reasons.
 * @module features/phase2/components/parts/CarrozaRiwiRenderer
 */

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { resolvePublicSrc, resolvePublicSrcs } from '@/shared/utils/media'
import { useVideoPlaylistTexture, resolvePlaylist } from '@/shared/hooks/useVideoPlaylistTexture'
import { isCollisionMesh } from '@/models/shared/collisionMesh'
import { useParadeLoopMotion } from '@/features/phase2/renderers/paradeLoop'
import type { EntityRendererProps } from '@/engine/types'

/** Material name the Blender script (`carrosa_riwi.py`) gives the laptop's video screen. */
const SCREEN_MATERIAL_NAME = 'PantallaVideo'
/** Side-to-side sway period and amplitude — reads as dancing to the speaker's beat. */
const SWAY_PERIOD_SECONDS = 1.6
const SWAY_AMPLITUDE_RAD = THREE.MathUtils.degToRad(4)

/**
 * Loaded float body, with its screen mesh swapped for the playlist video (or
 * left as the model's authored material when there's nothing to play).
 * @param props - Video texture, or `null` for no playlist
 * @returns Model primitive
 */
function CarrozaBody({ texture }: { texture: THREE.VideoTexture | null }) {
  const { scene } = useGLTF(modelRegistry['phase2/carrosa-riwi'].path) as unknown as { scene: THREE.Group }
  const screenMaterial = useMemo(() => (texture ? new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }) : null), [texture])

  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      if (isCollisionMesh(mesh)) {
        mesh.visible = false
        return
      }
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return c
  }, [scene])

  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material)) return
      if (mesh.material.name === SCREEN_MATERIAL_NAME && screenMaterial) {
        mesh.userData.originalMaterial ??= mesh.material
        mesh.material = screenMaterial
      }
    })
  }, [cloned, screenMaterial])


  return <primitive object={cloned} />
}

/**
 * Resolves the entity's video playlist and hands it to {@link CarrozaBody};
 * isolated so `Suspense` only holds back the float while the model loads,
 * not while the (independently-loading) video buffers.
 * @param props - Entity props
 * @returns Float with its playlist screen
 */
function CarrozaWithPlaylist({ entity }: { entity: EntityRendererProps['entity'] }) {
  const playlist = useMemo(
    () => resolvePlaylist(resolvePublicSrc(entity.videoSrc), resolvePublicSrcs(entity.videoSrcs)),
    [entity.videoSrc, entity.videoSrcs]
  )
  const texture = useVideoPlaylistTexture(playlist, false)
  return <CarrozaBody texture={texture} />
}

/**
 * @param props - Fallback rendered while loading or when the asset is missing
 * @returns Same HEAD-check/Suspense contract as `ModelLoader`
 */
function CarrozaLoader({ entity, fallback }: { entity: EntityRendererProps['entity']; fallback: ReactNode }) {
  const src = modelRegistry['phase2/carrosa-riwi'].path
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(src, { method: 'HEAD' })
      .then((r) => {
        if (cancelled) return
        const ct = r.headers.get('content-type') ?? ''
        setAvailable(r.ok && !ct.includes('text/html'))
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [src])

  if (available !== true) return <>{fallback}</>

  return (
    <Suspense fallback={fallback}>
      <CarrozaWithPlaylist entity={entity} />
    </Suspense>
  )
}

/**
 * @param props - Entity props and the procedural fallback for when the `.glb` is missing
 * @returns Loop-driving, swaying, video-playing Riwi float
 */
export function CarrozaRiwiRenderer({ entity, fallback }: { entity: EntityRendererProps['entity']; fallback: ReactNode }) {
  const loopRef = useRef<THREE.Group>(null)
  const swayRef = useRef<THREE.Group>(null)
  useParadeLoopMotion(loopRef, entity.id, entity.variant)

  useFrame(({ clock }) => {
    if (!swayRef.current) return
    swayRef.current.rotation.z = Math.sin((clock.elapsedTime * Math.PI * 2) / SWAY_PERIOD_SECONDS) * SWAY_AMPLITUDE_RAD
  })

  return (
    <group ref={loopRef}>
      <group ref={swayRef}>
        <CarrozaLoader entity={entity} fallback={fallback} />
      </group>
    </group>
  )
}