import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useImagePreviewTexture } from '@/shared/hooks/useImagePreviewTexture'
import { BOOK_PAGES, PAGE_FLOAT_Y, PAGE_TABLE_TOP_Y, type BookPage } from '@/features/library/config/bookPages'
import { RosaBookModel } from '@/models/shared/RosaBookModel'

/** Paper sheet size — every page floats on the same sheet, its scan fitted inside without cropping. */
const SHEET_W = 0.64
const SHEET_H = 0.86
/** Margin kept around the scan on the sheet. */
const SHEET_MARGIN = 0.04
/** How far the outline shell reaches past the sheet's edges. */
const OUTLINE_MARGIN = 0.035
/** Height of the floating book on the center table, and its width and thickness at that height. */
const BOOK_H = 0.66
const BOOK_W = BOOK_H * (0.245 / 0.32)
const BOOK_T = BOOK_H * (0.036 / 0.32)

/** How close the player must be to a page to pick it up. */
const FOCUS_RANGE = 3
/** How closely the crosshair must point at a page (angle from the view direction) to focus it. */
const FOCUS_COS = Math.cos((13 * Math.PI) / 180)

/** Marks translucent meshes so the library's wormhole fade (see `LibraryScene`) leaves their opacity alone. */
const OWNS_OPACITY = { ownsOpacity: true }

/** Shared materials for the tables. */
const mats = {
  wood: new THREE.MeshStandardMaterial({ color: '#4a2812', roughness: 0.5 }),
  gold: new THREE.MeshStandardMaterial({ color: '#c9a86a', roughness: 0.28, metalness: 0.75, emissive: '#3a2608', emissiveIntensity: 0.35 }),
  paper: new THREE.MeshStandardMaterial({ color: '#f4e8cf', roughness: 0.9 }),
}

/**
 * @returns Canvas texture of a soft warm radial glow, fully transparent at its edge
 */
function createGlowTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,226,150,0.85)')
  gradient.addColorStop(0.45, 'rgba(255,190,90,0.25)')
  gradient.addColorStop(1, 'rgba(255,170,60,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

/**
 * Props for {@link BookPageDisplay}.
 */
interface BookPageDisplayProps {
  /** Page on display. */
  page: BookPage
  /** Position in the ring — staggers the float and spin. */
  index: number
  /** Whether the crosshair is on this page. */
  focused: boolean
  /** Shared halo texture. */
  glow: THREE.Texture
}

/**
 * One display table: a round gilded table with a page of the Libro de Rosa
 * floating and turning over it, its scan on both faces — or, on the center
 * table, the closed book itself showing its cover. When focused it
 * stops to face the player, grows a little, brightens and is outlined — by
 * a slightly larger gold shell drawn from its back faces, so only a rim shows
 * around the sheet from any angle (drei's `Outlines` crashes the canvas on
 * unmount in this drei version, so it isn't used).
 *
 * @param props - Page, stagger, focus and halo
 * @returns Table group
 */
const BookPageDisplay = memo(function BookPageDisplay({ page, index, focused, glow }: BookPageDisplayProps) {
  const preview = useImagePreviewTexture(page.src)
  const sheetRef = useRef<THREE.Group>(null)
  const haloRef = useRef<THREE.Sprite>(null)
  const outlineRef = useRef<THREE.Mesh>(null)
  const outlineMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffd98a', side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    []
  )
  const state = useRef({ yaw: index * 1.1, scale: 1, glow: 0 })
  const isBook = page.display === 'book'

  const image = useMemo(() => {
    const aspect = preview?.aspect ?? SHEET_W / SHEET_H
    const maxW = SHEET_W - SHEET_MARGIN * 2
    const maxH = SHEET_H - SHEET_MARGIN * 2
    return aspect > maxW / maxH ? { w: maxW, h: maxW / aspect } : { w: maxH * aspect, h: maxH }
  }, [preview])

  useFrame(({ clock, camera }, delta) => {
    const sheet = sheetRef.current
    if (!sheet) return
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    const s = state.current
    if (focused) {
      const facing = Math.atan2(camera.position.x - page.table[0], camera.position.z - page.table[1])
      const diff = Math.atan2(Math.sin(facing - s.yaw), Math.cos(facing - s.yaw))
      s.yaw += diff * Math.min(1, dt * 5)
    } else {
      s.yaw += dt * 0.55
    }
    s.scale = THREE.MathUtils.damp(s.scale, focused ? 1.14 : 1, 6, dt)
    s.glow = THREE.MathUtils.damp(s.glow, focused ? 1 : 0, 6, dt)
    sheet.position.y = PAGE_FLOAT_Y + Math.sin(t * 1.2 + index) * 0.06
    sheet.rotation.set(Math.sin(t * 0.7 + index) * 0.05, s.yaw, Math.sin(t * 0.9 + index * 2) * 0.04)
    sheet.scale.setScalar(s.scale)
    if (outlineRef.current) {
      const outline = outlineRef.current.material as THREE.MeshBasicMaterial
      outline.opacity = s.glow * (0.85 + Math.sin(t * 6) * 0.15)
      outlineRef.current.visible = s.glow > 0.02
    }
    if (haloRef.current) {
      const h = 1.5 + s.glow * 0.6 + Math.sin(t * 2 + index) * 0.05
      haloRef.current.scale.set(h, h * 1.25, 1)
      haloRef.current.position.y = sheet.position.y
      haloRef.current.material.opacity = 0.35 + s.glow * 0.45
    }
  })

  return (
    <group position={[page.table[0], 0, page.table[1]]}>
      <mesh position={[0, 0.04, 0]} material={mats.gold} castShadow>
        <cylinderGeometry args={[0.34, 0.4, 0.08, 24]} />
      </mesh>
      <mesh position={[0, PAGE_TABLE_TOP_Y / 2, 0]} material={mats.wood} castShadow>
        <cylinderGeometry args={[0.07, 0.1, PAGE_TABLE_TOP_Y, 12]} />
      </mesh>
      <mesh position={[0, PAGE_TABLE_TOP_Y, 0]} material={mats.wood} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.48, 0.06, 32]} />
      </mesh>
      <mesh position={[0, PAGE_TABLE_TOP_Y + 0.031, 0]} rotation-x={Math.PI / 2} material={mats.gold}>
        <torusGeometry args={[0.49, 0.018, 8, 40]} />
      </mesh>
      <mesh position={[0, PAGE_TABLE_TOP_Y + 0.035, 0]} rotation-x={-Math.PI / 2} userData={OWNS_OPACITY}>
        <ringGeometry args={[0.16, 0.22, 40]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, (PAGE_TABLE_TOP_Y + PAGE_FLOAT_Y) / 2, 0]} userData={OWNS_OPACITY}>
        <cylinderGeometry args={[0.28, 0.2, PAGE_FLOAT_Y - PAGE_TABLE_TOP_Y, 20, 1, true]} />
        <meshBasicMaterial color="#ffe2a0" transparent opacity={0.07} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <sprite ref={haloRef} position={[0, PAGE_FLOAT_Y, 0]}>
        <spriteMaterial map={glow} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      <group ref={sheetRef} position={[0, PAGE_FLOAT_Y, 0]}>
        {isBook ? (
          <>
            <RosaBookModel height={BOOK_H} />
            <mesh ref={outlineRef} material={outlineMaterial} visible={false}>
              <boxGeometry args={[BOOK_W + OUTLINE_MARGIN * 2, BOOK_H + OUTLINE_MARGIN * 2, BOOK_T + OUTLINE_MARGIN]} />
            </mesh>
          </>
        ) : (
          <>
            <mesh material={mats.paper} castShadow>
              <boxGeometry args={[SHEET_W, SHEET_H, 0.012]} />
            </mesh>
            <mesh ref={outlineRef} material={outlineMaterial} visible={false}>
              <boxGeometry args={[SHEET_W + OUTLINE_MARGIN * 2, SHEET_H + OUTLINE_MARGIN * 2, 0.03]} />
            </mesh>
          </>
        )}
        {!isBook && preview && (
          <>
            <mesh position={[0, 0, 0.0065]}>
              <planeGeometry args={[image.w, image.h]} />
              <meshBasicMaterial map={preview.texture} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, -0.0065]} rotation-y={Math.PI}>
              <planeGeometry args={[image.w, image.h]} />
              <meshBasicMaterial map={preview.texture} toneMapped={false} />
            </mesh>
          </>
        )}
      </group>
    </group>
  )
})

/**
 * Props for {@link BookPageDisplays}.
 */
interface BookPageDisplaysProps {
  /** Whether the player can pick pages up (off during a wormhole, the page modal or the editor). */
  interactive: boolean
  /** Page currently under the crosshair, if any. */
  focusedPageId: string | null
  /** Reports the page under the crosshair as it changes. */
  onFocusChange: (id: string | null) => void
}

/** Reused vectors so focus detection allocates nothing per frame. */
const scratch = { forward: new THREE.Vector3(), toPage: new THREE.Vector3() }

/**
 * The restored library's display tables — the book at the center and six
 * pages around it — and the crosshair test that
 * decides which page the player is looking at: the nearest-to-center page
 * within reach whose direction lies close to the view direction.
 *
 * @param props - Interactivity and focus state
 * @returns Tables group
 */
export const BookPageDisplays = memo(function BookPageDisplays({ interactive, focusedPageId, onFocusChange }: BookPageDisplaysProps) {
  const glow = useMemo(() => createGlowTexture(), [])
  const lastFocus = useRef<string | null>(null)

  useFrame(({ camera }) => {
    let best: string | null = null
    if (interactive) {
      camera.getWorldDirection(scratch.forward)
      let bestDot = FOCUS_COS
      for (const page of BOOK_PAGES) {
        scratch.toPage.set(page.table[0], PAGE_FLOAT_Y, page.table[1]).sub(camera.position)
        const dist = scratch.toPage.length()
        if (dist > FOCUS_RANGE || dist < 0.01) continue
        const dot = scratch.toPage.divideScalar(dist).dot(scratch.forward)
        if (dot > bestDot) {
          bestDot = dot
          best = page.id
        }
      }
    }
    if (best !== lastFocus.current) {
      lastFocus.current = best
      onFocusChange(best)
    }
  })

  return (
    <group>
      {BOOK_PAGES.map((page, i) => (
        <BookPageDisplay key={page.id} page={page} index={i} focused={focusedPageId === page.id} glow={glow} />
      ))}
    </group>
  )
})
