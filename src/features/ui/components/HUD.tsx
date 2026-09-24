import { memo, type ReactNode } from 'react'
import { FiEye, FiMove, FiBookOpen, FiClock, FiArrowRight, FiRotateCcw, FiZap, FiMousePointer, FiLoader } from 'react-icons/fi'
import { LuOrbit } from 'react-icons/lu'

/**
 * Props for {@link HUD}.
 */
interface HUDProps {
  /** Whether the player is within interaction range. */
  nearBook: boolean
  /** Whether the wormhole transition is active. */
  wormholeActive: boolean
  /** Interaction handler. */
  onInteract: () => void
  /** Which scene's title/date labels to show. */
  variant: 'library' | 'phase1' | 'phase2' | 'cityIntro'
}

/** Title-area copy per {@link HUDProps.variant}. */
const VARIANT_COPY: Record<HUDProps['variant'], { eyebrow: string; title: string; clock: ReactNode }> = {
  library: {
    eyebrow: 'Biblioteca del Futuro — Año 2050',
    title: 'Penumbra del Futuro Abandonado',
    clock: (
      <span>
        25 de Septiembre — 2050 <span className="text-parchment/35">•</span> Biblioteca del Futuro
      </span>
    ),
  },
  phase1: {
    eyebrow: 'Fase 1 — Barrio Abajo (1857–1900)',
    title: 'Orígenes • Abajo del Río Magdalena',
    clock: (
      <span>
        1857–1900 <span className="text-parchment/35">•</span> Barrio Abajo • Bahareque y Andenes Altos
      </span>
    ),
  },
  phase2: {
    eyebrow: 'Fase 2 — Época Dorada (1919–1950s)',
    title: 'Tradición y Carnaval',
    clock: (
      <span>
        1919–1950s <span className="text-parchment/35">•</span> Época Dorada • Trinitarias y Carnaval
      </span>
    ),
  },
  cityIntro: {
    eyebrow: 'Escena Final — Año 2050',
    title: 'El Futuro que Construimos',
    clock: (
      <span>
        2050 <span className="text-parchment/35">•</span> Ciudad Futura
      </span>
    ),
  },
}

/**
 * Heads-up display with crosshair, controls legend and interaction prompts.
 * Memoized to avoid re-renders from unrelated scene updates.
 *
 * @param props - HUD state
 * @returns HUD overlay
 */
export const HUD = memo(function HUD({ nearBook, wormholeActive, onInteract, variant }: HUDProps) {
  const copy = VARIANT_COPY[variant]
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-5 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.65)_100%)]" />

      <div className="pointer-events-none fixed left-1/2 top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 opacity-90">
        <div className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-parchment shadow-[0_0_6px_rgba(255,220,120,0.8)]" />
        <div className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-parchment shadow-[0_0_6px_rgba(255,220,120,0.8)]" />
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-bright shadow-[0_0_8px_#ffcc33]" />
      </div>

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-cinzel text-[11px] tracking-[0.3em] uppercase text-parchment/60">{copy.eyebrow}</div>
            <div className="font-cinzel mt-1.5 text-[22px] tracking-[0.08em] text-parchment drop-shadow-[0_2px_20px_rgba(255,220,120,0.4)]">
              {copy.title}
            </div>
          </div>

          <div className="hidden sm:flex flex-col gap-1 rounded-lg border border-[#ffdc78]/10 bg-black/35 px-4 py-3 backdrop-blur-md text-right">
            <span className="flex items-center justify-end gap-2 text-[11px] tracking-[0.12em] uppercase text-parchment/50">
              <FiMove className="h-3.5 w-3.5 text-gold" /> WASD — Moverse
            </span>
            <span className="flex items-center justify-end gap-2 text-[11px] tracking-[0.12em] uppercase text-parchment/50">
              <FiEye className="h-3.5 w-3.5 text-gold" /> Mouse — Mirar
            </span>
            <span className="flex items-center justify-end gap-2 text-[11px] tracking-[0.12em] uppercase text-parchment/50">
              <FiZap className="h-3.5 w-3.5 text-gold" /> Shift — Correr
            </span>
            <span className="flex items-center justify-end gap-2 text-[11px] tracking-[0.12em] uppercase text-parchment/50">
              <FiMousePointer className="h-3.5 w-3.5 text-gold" /> E / Click — Interactuar
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          {nearBook && !wormholeActive && (
            <button
              onClick={onInteract}
              className="pointer-events-auto flex animate-pulse cursor-pointer items-center gap-3.5 rounded-full border border-[#ffdc78]/35 bg-[#0a080f]/85 px-7 py-3.5 shadow-[0_0_30px_rgba(255,180,40,0.25),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition hover:scale-[1.02] hover:shadow-[0_0_45px_rgba(255,180,40,0.45)]"
            >
              <span className="flex h-7 items-center justify-center rounded-md bg-parchment px-2.5 text-[13px] font-bold text-[#1a1205] shadow-[0_2px_0_#b89a4a]">E</span>
              <span className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.14em] uppercase text-parchment">
                <FiBookOpen className="h-4 w-4 text-gold-bright" />
                Despertar el Libro de Rosa
              </span>
            </button>
          )}
          {wormholeActive && (
            <div className="flex items-center gap-3 rounded-full border border-[#78b4ff]/50 bg-[#0a0f1e]/90 px-7 py-3.5 shadow-[0_0_45px_rgba(80,140,255,0.65)] backdrop-blur-xl">
              <LuOrbit className="h-5 w-5 animate-spin text-[#78b4ff]" />
              <span className="text-[13px] font-semibold tracking-[0.22em] uppercase text-[#a8c8ff]">Atravesando el Vórtice del Tiempo</span>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-6 z-10 flex items-center gap-2 rounded-md border border-white/5 bg-black/30 px-3 py-2 text-[11px] tracking-[0.14em] uppercase text-parchment/60 backdrop-blur-md">
        <FiClock className="h-3.5 w-3.5 opacity-70 text-gold" />
        {wormholeActive ? <span className="text-[#a8c8ff]">Vórtice del Tiempo • Sincronizando</span> : copy.clock}
      </div>

      <div
        className={`pointer-events-none fixed inset-0 z-15 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_80%)] transition-opacity duration-700 ${wormholeActive ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
})

/**
 * Props for {@link StartOverlay}.
 */
interface StartOverlayProps {
  /** Starts the city walk. */
  onStart: () => void
  /** Whether the city scene is warming up before reveal — disables the button and shows a spinner. */
  loading?: boolean
}

/**
 * Full-screen start screen prompting the user to begin the city walk.
 *
 * @param props - Overlay actions and loading state
 * @returns Start overlay
 */
export const StartOverlay = memo(function StartOverlay({ onStart, loading = false }: StartOverlayProps) {
  const handleStart = (): void => {
    if (!loading) onStart()
  }
  return (
    <div
      onClick={handleStart}
      className={`fixed inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(10,10,22,0.94)_0%,rgba(4,4,10,0.98)_70%)] p-8 text-center backdrop-blur-xs ${loading ? 'cursor-progress' : 'cursor-pointer'}`}
    >
      <div className="max-w-2xl">
        <div className="font-cinzel text-[11px] tracking-[0.42em] uppercase text-parchment/60">Escena -1 — Año 2050</div>
        <h1 className="font-cinzel mt-3 text-[clamp(28px,6vw,54px)] leading-[1.1] tracking-[0.14em] uppercase text-parchment drop-shadow-[0_0_40px_rgba(120,180,255,0.4)]">
          La Biblioteca
          <span className="block bg-linear-to-r from-[#7ad8ff] to-[#a8a0ff] bg-clip-text text-transparent">Abandonada</span>
        </h1>
        <p className="mx-auto mt-6 max-w-140 text-[14px] leading-7 tracking-[0.04em] text-parchment/70">
          Año 2050. Despiertas entre estanterías polvorientas, iluminadas por antorchas que no deberían seguir ardiendo.
          <br />
          En el centro de la sala flota <span className="text-gold-bright font-semibold">El Libro de Rosa</span>, guardián del Vórtice del
          Tiempo.
          <br />
          Acércate y despiértalo para cruzar hacia el pasado.
        </p>
        <p className="mx-auto mt-4 flex items-center justify-center gap-2 text-[12px] tracking-[0.08em] text-parchment/45">
          <FiEye className="h-3.5 w-3.5" /> WASD — moverse · mouse — mirar alrededor
        </p>

        <button
          onClick={handleStart}
          disabled={loading}
          className="mt-9 inline-flex items-center gap-3 rounded-full bg-linear-to-b from-gold-bright to-[#ffb400] px-8 py-4 text-[13px] font-bold tracking-[0.18em] uppercase text-[#1a1205] shadow-[0_8px_30px_rgba(255,180,40,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(255,180,40,0.55)] disabled:cursor-progress disabled:opacity-80 disabled:hover:translate-y-0 disabled:hover:scale-100"
        >
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
        <p className="mt-4 text-[11px] tracking-wide text-parchment/35">Click para activar controles y sonido — ESC para salir</p>
      </div>
    </div>
  )
})

/**
 * Props for {@link PastOverlay}.
 */
interface PastOverlayProps {
  /** Dismisses the museum intro. */
  onReturn: () => void
}

/**
 * Museum intro overlay displayed after wormhole completion.
 *
 * @param props - Overlay actions
 * @returns Past overlay
 */
export const PastOverlay = memo(function PastOverlay({ onReturn }: PastOverlayProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(18,30,35,0.96)_0%,rgba(4,10,14,0.98)_75%)] p-8 text-center">
      <div className="font-cinzel text-[11px] tracking-[0.42em] uppercase text-[#a8c8ff]/70">Fase 1 — Orígenes (Fines S. XIX – Inicios S. XX)</div>
      <h1 className="font-cinzel mt-3 text-[clamp(28px,6vw,54px)] leading-[1.1] tracking-[0.18em] uppercase text-[#e8f0ff] drop-shadow-[0_0_30px_rgba(100,160,255,0.45)]">
        Barrio Abajo
      </h1>
      <p className="mx-auto mt-6 max-w-140 text-[14px] leading-7 tracking-[0.04em] text-white/70">
        “Abajo del Río” Magdalena — 1857, declaratoria de ciudad, auge portuario de Aduana y Estación Montoya, inmigración en pasajes y arquitectura de bahareque con andenes altos contra los arroyos.
        <br />
        Camina entre tierra y fotos sepia flotando. Cada imagen guarda un fragmento de memoria.
      </p>
      <button
        onClick={onReturn}
        className="mt-9 inline-flex items-center gap-3 rounded-full bg-linear-to-b from-[#a8c8ff] to-[#5b8def] px-8 py-4 text-[13px] font-bold tracking-[0.18em] uppercase text-[#0a1020] shadow-[0_8px_30px_rgba(90,140,255,0.35)] transition hover:-translate-y-0.5 hover:scale-[1.02]"
      >
        <FiRotateCcw className="h-4 w-4" />
        Volver a la biblioteca
      </button>
    </div>
  )
})
