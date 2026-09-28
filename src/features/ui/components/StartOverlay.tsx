/**
 * The experience's start screen: a translucent veil over the waiting library
 * with drifting auroras and golden dust, the Libro de Rosa floating as its
 * hero, a staggered title reveal, the start button and the partners' logos.
 * @module features/ui/components/StartOverlay
 */

import { memo, useMemo, type CSSProperties } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { FiArrowRight, FiEye, FiLoader } from 'react-icons/fi'
import { StoryBook3D } from '@/features/storyBook/components/StoryBook3D'
import { createSeededRandom } from '@/shared/utils/random'
import { PartnerLogos } from '@/shared/components/PartnerLogos'

/**
 * Props for {@link StartOverlay}.
 */
interface StartOverlayProps {
  /** Starts the experience, entering the library. */
  onStart: () => void
  /** Whether the city scene is warming up before reveal — disables the button and shows a spinner. */
  loading?: boolean
}

/** Golden dust motes rising through the screen. */
const DUST_COUNT = 38

/** One dust mote's placement and timing. */
interface DustMote {
  left: number
  size: number
  duration: number
  delay: number
  drift: number
}

/**
 * @param delay - Seconds before the element's entrance starts
 * @returns Style for a staggered rise-in entrance
 */
function riseIn(delay: number): CSSProperties {
  return { animation: `start-rise 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}s both` }
}

/**
 * Full-screen start screen. Only its button (or the `E` key, see
 * `HotkeyRouter`) starts the experience — stray clicks elsewhere do nothing.
 *
 * @param props - Overlay actions and loading state
 * @returns Start overlay
 */
export const StartOverlay = memo(function StartOverlay({ onStart, loading = false }: StartOverlayProps) {
  const dust = useMemo<DustMote[]>(() => {
    const random = createSeededRandom(2050)
    return Array.from({ length: DUST_COUNT }, () => ({
      left: random() * 100,
      size: 1.5 + random() * 3,
      duration: 9 + random() * 12,
      delay: -random() * 20,
      drift: (random() - 0.5) * 60,
    }))
  }, [])

  const handleStart = (): void => {
    if (!loading) onStart()
  }

  return (
    <div className={`fixed inset-0 z-20 overflow-hidden text-center ${loading ? 'cursor-progress' : ''}`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,10,24,0.55)_0%,rgba(4,4,12,0.88)_62%,rgba(2,2,6,0.97)_100%)] backdrop-blur-[3px]" />
      <div
        className="pointer-events-none absolute top-[-20vh] left-[-15vw] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(90,190,255,0.28)_0%,transparent_65%)] blur-2xl"
        style={{ animation: 'start-drift 18s ease-in-out infinite' }}
      />
      <div
        className="pointer-events-none absolute right-[-10vw] bottom-[-25vh] h-[80vh] w-[80vh] rounded-full bg-[radial-gradient(circle,rgba(255,190,80,0.24)_0%,transparent_65%)] blur-2xl"
        style={{ animation: 'start-drift 22s ease-in-out -7s infinite reverse' }}
      />
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 h-[55vh] w-[55vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,160,255,0.16)_0%,transparent_60%)] blur-3xl"
        style={{ animation: 'start-halo 7s ease-in-out infinite' }}
      />

      <div className="pointer-events-none absolute inset-0">
        {dust.map((mote, i) => (
          <span
            key={i}
            className="absolute bottom-[-2vh] rounded-full bg-[#ffe3a0] shadow-[0_0_8px_rgba(255,210,120,0.9)]"
            style={
              {
                left: `${mote.left}%`,
                width: mote.size,
                height: mote.size,
                '--start-drift-x': `${mote.drift}px`,
                animation: `start-float ${mote.duration}s linear ${mote.delay}s infinite`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative flex h-full flex-col items-center justify-center overflow-y-auto px-6 pt-8 pb-28">
        <div className="relative h-44 w-44 shrink-0 sm:h-52 sm:w-52" style={riseIn(0.1)}>
          <div
            className="absolute inset-3 rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,204,85,0.55)_18%,transparent_36%,rgba(122,216,255,0.45)_60%,transparent_78%)] opacity-70 blur-[1px]"
            style={{ animation: 'spin 14s linear infinite', maskImage: 'radial-gradient(circle, transparent 60%, black 62%, black 66%, transparent 68%)' }}
          />
          <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(255,204,85,0.45)_0%,rgba(255,150,40,0.1)_55%,transparent_72%)] blur-xl" style={{ animation: 'start-halo 4.5s ease-in-out infinite' }} />
          <Canvas
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
            camera={{ fov: 35, position: [0, 0, 2.7] }}
            style={{ position: 'absolute', inset: 0, background: 'transparent' }}
          >
            <StoryBook3D stage="calm" />
          </Canvas>
        </div>

        <div className="mt-2 flex items-center gap-3" style={riseIn(0.35)}>
          <span className="h-px w-10 bg-linear-to-r from-transparent to-gold/70 sm:w-16" />
          <span className="font-cinzel text-[11px] tracking-[0.42em] uppercase text-parchment/70">Escena -1 — Año 2050</span>
          <span className="h-px w-10 bg-linear-to-l from-transparent to-gold/70 sm:w-16" />
        </div>

        <h1
          className="font-cinzel mt-3 text-[clamp(30px,6.4vw,60px)] leading-[1.08] tracking-[0.14em] uppercase text-parchment drop-shadow-[0_0_40px_rgba(120,180,255,0.35)]"
          style={riseIn(0.55)}
        >
          La Biblioteca
          <span
            className="block bg-linear-to-r from-[#7ad8ff] via-[#ffe6a8] to-[#a8a0ff] bg-size-[200%_auto] bg-clip-text text-transparent"
            style={{ animation: 'start-shimmer 6s linear infinite' }}
          >
            Abandonada
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-140 text-[14px] leading-7 tracking-[0.04em] text-parchment/75" style={riseIn(0.8)}>
          Año 2050. Despiertas entre estanterías polvorientas, iluminadas por antorchas que no deberían seguir ardiendo.
          <br />
          En el centro de la sala flota <span className="font-semibold text-gold-bright">El Libro de Rosa</span>, guardián del Vórtice del Tiempo.
          <br />
          Acércate y despiértalo para cruzar hacia el pasado.
        </p>
        <p className="mx-auto mt-4 flex items-center justify-center gap-2 text-[12px] tracking-[0.08em] text-parchment/45" style={riseIn(0.95)}>
          <FiEye className="h-3.5 w-3.5" /> WASD — moverse · mouse — mirar alrededor
        </p>

        <div className="relative mt-9" style={riseIn(1.15)}>
          {!loading && (
            <span
              className="pointer-events-none absolute -inset-2 rounded-full border border-gold-bright/50"
              style={{ animation: 'start-ring 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite' }}
            />
          )}
          <button
            onClick={handleStart}
            disabled={loading}
            className="relative inline-flex cursor-pointer items-center gap-3 overflow-hidden rounded-full bg-linear-to-b from-gold-bright to-[#ffb400] px-8 py-4 text-[13px] font-bold tracking-[0.18em] uppercase text-[#1a1205] shadow-[0_8px_30px_rgba(255,180,40,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(255,180,40,0.55)] disabled:cursor-progress disabled:opacity-80 disabled:hover:translate-y-0 disabled:hover:scale-100"
          >
            <span
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/55 to-transparent"
              style={{ animation: 'start-sheen 3.6s ease-in-out 1.8s infinite' }}
            />
            {loading ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Despertando la Biblioteca…
              </>
            ) : (
              <>
                <FiArrowRight className="h-4 w-4" />
                Entrar a la Biblioteca
              </>
            )}
          </button>
        </div>
        <p className="mt-4 text-[11px] tracking-wide text-parchment/35" style={riseIn(1.3)}>
          Presiona E o el botón para entrar — ESC para salir
        </p>
      </div>

      <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6" style={riseIn(1.5)}>
        <span className="font-cinzel text-[9px] tracking-[0.32em] uppercase text-parchment/40">Con el apoyo de</span>
        <PartnerLogos />
      </div>
    </div>
  )
})
