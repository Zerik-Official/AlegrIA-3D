/**
 * `credits/decorators/televisor` renderer — the RIWI room's TV on its rolling
 * stand (see `.vscode/scripts/riwi-televisor.py`). Its screen mesh (Blender
 * material `TV_Pantalla`) shows the `mocadevia-canal.png` poster as an unlit
 * material while `mocadevia-last-video.mp4` buffers, then swaps to the video
 * texture once it can play through — muted and looping from there on.
 *
 * Bypasses `ModelLoader` (no material-swap hook there) the same way
 * `ScreenBuildingRenderer` and `CarrozaRiwiRenderer` do for their own
 * screens, keeping the HEAD-check/Suspense/error-boundary contract for the
 * `.glb` itself while the poster/video load independently outside Suspense.
 * @module features/credits/components/CreditsTelevisorRenderer
 */

import { Component, Suspense, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { resolvePublicSrc, resolvePublicSrcs } from '@/shared/utils/media'
import { resolvePlaylist } from '@/shared/hooks/useVideoPlaylistTexture'
import { isCollisionMesh } from '@/models/shared/collisionMesh'
import type { EntityRendererProps } from '@/engine/types'

const base = import.meta.env.BASE_URL

/** Blender material on the TV's screen mesh, authored by `riwi-televisor.py`. */
const SCREEN_MATERIAL_NAME = 'TV_Pantalla'

/** Poster shown on the screen while the video buffers. */
const DEFAULT_POSTER_SRC = '/images/credits/mocadevia-canal.png'

/** Feature video played muted on loop once buffered. */
const DEFAULT_VIDEO_SRC = '/videos/credits/mocadevia-last-video.mp4'

/**
 * Loads `src` as an sRGB texture without Suspense, so the TV mounts
 * instantly and the poster pops in as soon as it decodes.
 * @param src - Resolved poster URL, or `undefined` for none
 * @returns Poster texture once decoded, else `null`
 */
function usePosterTexture(src: string | undefined): THREE.Texture | null {
  const [published, setPublished] = useState<{ key: string; texture: THREE.Texture } | null>(null)

  useEffect(() => {
    if (!src) return
    let cancelled = false
    let loaded: THREE.Texture | null = null
    new THREE.TextureLoader().load(
      src,
      (tex) => {
        if (cancelled) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.flipY = false
        tex.anisotropy = 4
        loaded = tex
        setPublished({ key: src, texture: tex })
      },
      undefined,
      () => {}
    )
    return () => {
      cancelled = true
      loaded?.dispose()
    }
  }, [src])

  if (published && published.key === src) return published.texture
  return null
}

/**
 * Streams `src` muted and looping, reporting when it can play through so the
 * screen can swap from poster to video. Playback starts muted (autoplay-safe)
 * and stays muted — the credits room already has its own music track.
 * @param src - Resolved video URL, or `undefined` for none
 * @returns Video texture and whether it is ready to take over the screen
 */
function useBufferedLoopVideo(src: string | undefined): { texture: THREE.VideoTexture | null; ready: boolean } {
  const [published, setPublished] = useState<{ key: string; texture: THREE.VideoTexture } | null>(null)

  useEffect(() => {
    if (!src) return
    let cancelled = false
    let readyFired = false
    const video = document.createElement('video')
    video.src = src
    video.loop = true
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    video.preload = 'auto'
    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.colorSpace = THREE.SRGBColorSpace
    videoTexture.flipY = false
    const markReady = (): void => {
      if (readyFired || cancelled) return
      readyFired = true
      video.play().catch(() => {})
      setPublished({ key: src, texture: videoTexture })
    }
    const nudgePlayback = (): void => {
      video.play().catch(() => {})
    }
    video.addEventListener('canplaythrough', markReady, { once: true })
    video.addEventListener('canplay', nudgePlayback)
    video.load()
    nudgePlayback()
    if (video.readyState >= 3) markReady()
    return () => {
      cancelled = true
      video.removeEventListener('canplaythrough', markReady)
      video.removeEventListener('canplay', nudgePlayback)
      video.pause()
      video.removeAttribute('src')
      video.load()
      videoTexture.dispose()
    }
  }, [src])

  if (published && published.key === src) return { texture: published.texture, ready: true }
  return { texture: null, ready: false }
}

/**
 * Props for {@link TelevisorFallback}.
 */
interface TelevisorFallbackProps {
  /** Poster or ready video texture for the screen plane, if any has loaded yet. */
  texture: THREE.Texture | null
}

/**
 * Procedural TV shown while the authored `.glb` loads (Suspense fallback) or
 * when it is missing — marco, screen plane with the same poster/video
 * texture, and a simple post/base stand. Dimensions follow `riwi-televisor.py`
 * (`TW`/`TH`/`ZC`); the screen faces local `-Y` like the authored model.
 * The plane's UVs are flipped vertically to compensate for the `flipY=false`
 * convention the glTF-mapped textures use.
 * @param props - Screen texture
 * @returns Fallback TV group
 */
function TelevisorFallback({ texture }: TelevisorFallbackProps) {
  const screenGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1.428, 0.803)
    const uv = geometry.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i += 1) uv.setY(i, 1 - uv.getY(i))
    uv.needsUpdate = true
    return geometry
  }, [])

  useEffect(() => () => screenGeometry.dispose(), [screenGeometry])

  return (
    <group>
      <mesh position={[0, 0, 1.38]} castShadow>
        <boxGeometry args={[1.45, 0.028, 0.835]} />
        <meshStandardMaterial color="#121315" roughness={0.35} />
      </mesh>
      {texture ? (
        <mesh position={[0, -0.015, 1.385]} rotation-x={Math.PI / 2} geometry={screenGeometry}>
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      ) : null}
      <mesh position={[0, 0.85, 0.13]} castShadow>
        <boxGeometry args={[0.05, 1.6, 0.05]} />
        <meshStandardMaterial color="#17181a" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.05, 0.13]} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
        <meshStandardMaterial color="#17181a" roughness={0.45} metalness={0.35} />
      </mesh>
    </group>
  )
}

/**
 * Props for {@link TelevisorBody}.
 */
interface TelevisorBodyProps {
  /** Decoded poster texture, if any. */
  poster: THREE.Texture | null
  /** Streaming video texture, if any. */
  videoTexture: THREE.VideoTexture | null
  /** Whether the video can play through and should take over the screen. */
  videoReady: boolean
}

/**
 * Loaded TV with its `TV_Pantalla` mesh swapped for an unlit material showing
 * the poster while the video buffers and the looping muted video afterwards.
 * @param props - Poster/video textures and readiness
 * @returns Model primitive
 */
function TelevisorBody({ poster, videoTexture, videoReady }: TelevisorBodyProps) {
  const { scene } = useGLTF(modelRegistry['credits/decorators/televisor'].path) as unknown as { scene: THREE.Group }
  const active = videoReady && videoTexture ? videoTexture : poster
  const screenMaterial = useMemo(() => (active ? new THREE.MeshBasicMaterial({ map: active, toneMapped: false }) : null), [active])

  useEffect(() => () => screenMaterial?.dispose(), [screenMaterial])

  const cloned = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      if (isCollisionMesh(mesh)) {
        mesh.visible = false
        return
      }
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return copy
  }, [scene])

  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material)) return
      if (mesh.material.name === SCREEN_MATERIAL_NAME) {
        mesh.userData.originalMaterial ??= mesh.material
        mesh.userData.isTvScreen = true
      }
      if (mesh.userData.isTvScreen) {
        mesh.material = screenMaterial ?? (mesh.userData.originalMaterial as THREE.Material)
      }
    })
  }, [cloned, screenMaterial])

  return <primitive object={cloned} />
}

/**
 * Props for {@link TelevisorErrorBoundary}.
 */
interface TelevisorErrorBoundaryProps {
  /** Content attempting to load the model. */
  children: ReactNode
  /** Shown when the model fails to load. */
  fallback: ReactNode
}

/** State for {@link TelevisorErrorBoundary}. */
interface TelevisorErrorBoundaryState {
  /** Whether a load error was caught. */
  failed: boolean
}

/**
 * Catches `.glb` load failures and falls back to the procedural TV instead of
 * unmounting the Canvas — same contract as `ModelLoader`'s boundary.
 */
class TelevisorErrorBoundary extends Component<TelevisorErrorBoundaryProps, TelevisorErrorBoundaryState> {
  state: TelevisorErrorBoundaryState = { failed: false }

  /**
   * @param error - Load error thrown while rendering the model
   * @param info - React component stack
   */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn(`[CreditsTelevisor] Falling back to procedural placeholder: ${error.message}`, info.componentStack)
  }

  /**
   * @returns Fallback state once a load error is caught
   */
  static getDerivedStateFromError(): TelevisorErrorBoundaryState {
    return { failed: true }
  }

  /**
   * @returns Children, or the fallback after a load error
   */
  render(): ReactNode {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

/**
 * `credits/decorators/televisor` entity renderer — poster on the screen while
 * the feature video downloads, muted loop once it can play through.
 * `entity.imageSrc` overrides the poster and `entity.videoSrc`/`videoSrcs[0]`
 * overrides the video; otherwise the mocadevia defaults apply so the
 * `credits.json` entity needs no extra fields.
 * @param props - Entity props
 * @returns TV with buffering screen
 */
export function CreditsTelevisorRenderer({ entity }: EntityRendererProps) {
  const posterSrc = resolvePublicSrc(entity.imageSrc) ?? `${base}${DEFAULT_POSTER_SRC.replace(/^\//, '')}`
  const playlist = useMemo(
    () => resolvePlaylist(resolvePublicSrc(entity.videoSrc), resolvePublicSrcs(entity.videoSrcs)),
    [entity.videoSrc, entity.videoSrcs]
  )
  const videoSrc = playlist?.[0] ?? `${base}${DEFAULT_VIDEO_SRC.replace(/^\//, '')}`
  const poster = usePosterTexture(posterSrc)
  const { texture: videoTexture, ready: videoReady } = useBufferedLoopVideo(videoSrc)
  const active = videoReady && videoTexture ? videoTexture : poster

  const modelSrc = modelRegistry['credits/decorators/televisor'].path
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(modelSrc, { method: 'HEAD' })
      .then((response) => {
        if (cancelled) return
        const contentType = response.headers.get('content-type') ?? ''
        setModelAvailable(response.ok && !contentType.includes('text/html'))
      })
      .catch(() => {
        if (!cancelled) setModelAvailable(false)
      })
    return () => {
      cancelled = true
    }
  }, [modelSrc])

  if (modelAvailable !== true) return <TelevisorFallback texture={active} />

  return (
    <TelevisorErrorBoundary fallback={<TelevisorFallback texture={active} />}>
      <Suspense fallback={<TelevisorFallback texture={active} />}>
        <TelevisorBody poster={poster} videoTexture={videoTexture} videoReady={videoReady} />
      </Suspense>
    </TelevisorErrorBoundary>
  )
}
