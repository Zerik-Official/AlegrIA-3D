import { memo, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link SepiaPhotoFrame}.
 */
interface SepiaPhotoFrameProps {
  /** World position. */
  position: [number, number, number]
  /** Y rotation. */
  rotationY?: number
  /** Index for phase offset. */
  imageIndex?: number
  /** Whether the frame is highlighted due to proximity. */
  highlighted?: boolean
  /** JSON-declared image URL; falls back to the plain sepia tint when absent or unreachable. */
  imageSrc?: string
}

/** Width/height of the frame's photo plane — texture UVs are cropped to match this aspect. */
const FRAME_PHOTO_ASPECT = 1.32 / 0.9

/**
 * Crops `texture`'s UVs (repeat + offset) so its image covers `targetAspect`
 * without stretching, the same way CSS `object-fit: cover` would.
 * @param texture - Loaded texture to adjust in place
 * @param targetAspect - Destination plane's width/height ratio
 */
function applyCoverUv(texture: THREE.Texture, targetAspect: number): void {
  const image = texture.image as { width: number; height: number }
  if (!image.width || !image.height) return
  const imageAspect = image.width / image.height
  if (imageAspect > targetAspect) {
    const repeatX = targetAspect / imageAspect
    texture.repeat.set(repeatX, 1)
    texture.offset.set((1 - repeatX) / 2, 0)
  } else {
    const repeatY = imageAspect / targetAspect
    texture.repeat.set(1, repeatY)
    texture.offset.set(0, (1 - repeatY) / 2)
  }
}

/**
 * Resolves a user-provided or JSON-driven `imageSrc` to a fetchable public URL
 * that respects `vite.base` (`/AlegrIA-3D/`). Handles the common editor case where
 * the user types `/images/placeholders/x.jpg` or `images/...` without the base,
 * and passes through external URLs (`https://…`, `data:`, `blob:`) unchanged.
 * @param src - Raw src from entity JSON / editor input
 * @returns Normalized URL, or the original if it is already absolute/data/blob
 */
function resolvePublicUrl(src: string): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src
  const base = import.meta.env.BASE_URL as string
  if (src.startsWith(base)) return src
  const withoutPublic = src.replace(/^public\//, '')
  const withoutLeadingSlash = withoutPublic.replace(/^\//, '')
  return `${base}${withoutLeadingSlash}`
}

/**
 * Whether a URL is external (needs CORS handling for WebGL textures).
 * @param src - Normalized URL
 * @returns True for http/https external resources
 */
function isExternalUrl(src: string): boolean {
  return /^(https?:)?\/\//.test(src)
}

/**
 * Loads an image texture without suspending — resolves to `null` when `src` is
 * empty or fails to load, so callers can fall back to a procedural look.
 * Uses a DOM `Image` → `THREE.Texture` path so the same URL that works for
 * `PhotoModal`'s `<img>` also works for the levitating mesh, avoiding
 * `TextureLoader` NPOT/mipmap inconsistencies for PNG assets.
 *
 * @param src - Image URL, or undefined/empty to skip loading
 * @returns Loaded texture, cropped to {@link FRAME_PHOTO_ASPECT}, or null while loading/missing
 */
function useSafeTexture(src?: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!src) return
    const resolvedSrc = resolvePublicUrl(src)
    const external = isExternalUrl(resolvedSrc)
    let cancelled = false
    let activeTexture: THREE.Texture | null = null

    /**
     * Creates a `THREE.Texture` from a loaded `HTMLImageElement` with the
     * correct color space and UV cover handling.
     * @param img - Loaded image element
     * @returns Configured texture
     */
    const createTexture = (img: HTMLImageElement): THREE.Texture => {
      const tex = new THREE.Texture(img)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.generateMipmaps = false
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      applyCoverUv(tex, FRAME_PHOTO_ASPECT)
      tex.needsUpdate = true
      return tex
    }

    let img: HTMLImageElement | null = new Image()
    if (external) img.crossOrigin = 'anonymous'

    const onLoad = () => {
      if (cancelled || !img) return
      const tex = createTexture(img)
      activeTexture = tex
      setTexture((prev) => {
        if (prev && prev !== tex) prev.dispose()
        return tex
      })
    }

    const onError = (err: unknown) => {
      if (cancelled) return
      if (external && img && img.crossOrigin === 'anonymous') {
        const retry = new Image()
        retry.onload = () => {
          if (cancelled) return
          const tex = createTexture(retry)
          activeTexture = tex
          setTexture((prev) => {
            if (prev && prev !== tex) prev.dispose()
            return tex
          })
        }
        retry.onerror = (retryErr) => {
          if (cancelled) return
          console.warn(`[SepiaPhotoFrame] Failed to load external "${src}" (resolved "${resolvedSrc}")`, retryErr)
          setTexture((prev) => {
            if (prev) prev.dispose()
            return null
          })
        }
        retry.src = resolvedSrc
        img = retry
        return
      }
      console.warn(`[SepiaPhotoFrame] Failed to load "${src}" (resolved "${resolvedSrc}")`, err)
      setTexture((prev) => {
        if (prev) prev.dispose()
        return null
      })
    }

    img.onload = onLoad
    img.onerror = onError
    img.src = resolvedSrc
    return () => {
      cancelled = true
      if (activeTexture) activeTexture.dispose()
      img = null
    }
  }, [src])

  return src ? texture : null
}

/**
 * Floating sepia photo with orange tint and proximity highlight.
 * Renders `imageSrc` on the frame when provided by the entity JSON, otherwise
 * stays a plain sepia-tinted placeholder.
 *
 * @param props - Frame appearance
 * @returns Frame group
 */
export const SepiaPhotoFrame = memo(function SepiaPhotoFrame({ position, rotationY = 0, imageIndex = 0, highlighted = false, imageSrc }: SepiaPhotoFrameProps) {
  const ref = useRef<THREE.Group>(null)
  const frameRef = useRef<THREE.Mesh>(null)
  const texture = useSafeTexture(imageSrc)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime + imageIndex * 1.3
    ref.current.position.y = position[1] + Math.sin(t * 0.42) * 0.14
    ref.current.rotation.y = rotationY + Math.sin(t * 0.18) * 0.08
    ref.current.rotation.z = Math.sin(t * 0.22) * 0.04
    if (frameRef.current) {
      const mat = frameRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = highlighted ? 0.42 + Math.sin(t * 3.2) * 0.18 : 0.06
    }
    if (highlighted) {
      const s = 1.04 + Math.sin(clock.elapsedTime * 2.2) * 0.02
      ref.current.scale.set(s, s, s)
    } else {
      ref.current.scale.set(1, 1, 1)
    }
  })

  return (
    <group ref={ref} position={position} rotation-y={rotationY}>
      <mesh castShadow>
        <boxGeometry args={[1.45, 1.02, 0.04]} />
        <meshStandardMaterial color="#1a1208" roughness={0.72} />
      </mesh>
      <mesh ref={frameRef} position={[0, 0, 0.028]}>
        <boxGeometry args={[1.38, 0.96, 0.015]} />
        <meshStandardMaterial color={highlighted ? '#ffcc66' : '#c9a86a'} emissive={highlighted ? '#ff8a1a' : '#000000'} emissiveIntensity={highlighted ? 0.32 : 0} metalness={0.18} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[1.32, 0.9]} />
        <meshBasicMaterial key={texture ? texture.uuid : 'no-map'} map={texture} color={texture ? '#ffffff' : '#704214'} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.044]}>
        <planeGeometry args={[1.32, 0.9]} />
        <meshBasicMaterial
          color="#ff8a1a"
          transparent
          opacity={highlighted ? 0.32 : 0.22}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -0.58, 0.02]}>
        <planeGeometry args={[0.92, 0.08]} />
        <meshBasicMaterial color={highlighted ? '#ffcc66' : '#f5e6c8'} transparent opacity={highlighted ? 1 : 0.92} />
      </mesh>
      {highlighted && (
        <mesh position={[0, 0, 0.06]}>
          <ringGeometry args={[0.82, 0.86, 32]} />
          <meshBasicMaterial color="#ffcc66" transparent opacity={0.42} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
})
