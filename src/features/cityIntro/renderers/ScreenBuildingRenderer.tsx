/**
 * `screen-building` entity renderer for the `cityIntro` scene — the neon
 * building whose curved front screen (material `PantallaVideo`, UV-mapped)
 * and side screens (`PantallaSecundaria`) play the entity's `videoSrc`.
 * The model's front faces +Z, so rotate the entity to face the street.
 * @module features/cityIntro/renderers/ScreenBuildingRenderer
 */

import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { resolvePublicSrc, resolvePublicSrcs } from '@/shared/utils/media'
import { useVideoPlaylistTexture, resolvePlaylist } from '@/shared/hooks/useVideoPlaylistTexture'
import type { EntityRendererProps } from '@/engine/types'

/** Material names authored in Blender that should show the video. */
const SCREEN_MATERIALS = new Set(['PantallaVideo', 'PantallaSecundaria'])

/**
 * Clones the building and swaps its screen materials for an unlit material
 * showing `texture` (or leaves them dark when there is no video).
 * @param props.texture - Video texture, if any
 * @returns Building primitive
 */
function Building({ texture }: { texture: THREE.Texture | null }) {
  const { scene } = useGLTF(modelRegistry['cityIntro/screen-building'].path) as unknown as { scene: THREE.Group }
  const screenMaterial = useMemo(() => (texture ? new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }) : null), [texture])
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
    })
    return c
  }, [scene])

  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material)) return
      if (SCREEN_MATERIALS.has(mesh.material.name) && screenMaterial) {
        mesh.userData.originalMaterial ??= mesh.material
        mesh.material = screenMaterial
      }
    })
  }, [cloned, screenMaterial])

  return <primitive object={cloned} />
}

/**
 * @param props - Entity props (`videoSrc`/`videoSrcs` optional)
 * @returns Renderer element
 */
export function ScreenBuildingRenderer({ entity }: EntityRendererProps) {
  const playlist = useMemo(
    () => resolvePlaylist(resolvePublicSrc(entity.videoSrc), resolvePublicSrcs(entity.videoSrcs)),
    [entity.videoSrc, entity.videoSrcs]
  )
  const texture = useVideoPlaylistTexture(playlist, false)
  return <Building texture={texture} />
}
