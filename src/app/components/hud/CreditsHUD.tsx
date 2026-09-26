import { memo, useCallback, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { FiBookOpen, FiMusic, FiX } from 'react-icons/fi'
import {
  CREDITS_BOOK_AUTHOR,
  CREDITS_BOOK_DEDICATION,
  CREDITS_BOOK_HEADING,
  CREDITS_BOOK_QUOTE,
  CREDITS_HEADING,
  CREDITS_LEADER_ROLE,
  CREDITS_MUSIC_BY,
  CREDITS_ROLL,
  CREDITS_SUBHEADING,
} from '@/features/credits/config/creditsConfig'
import { useTypewriterProgress } from '@/features/credits/hooks/useTypewriterProgress'
import { CinematicCredits } from '@/features/credits/components/CinematicCredits'
import { EqualizerText } from '@/features/credits/components/EqualizerText'
import { StoryBook3D } from '@/features/storyBook/components/StoryBook3D'
import { PartnerLogos } from '@/shared/components/PartnerLogos'
import { LiveEqualizer } from '@/shared/components/LiveEqualizer'

/** Props for {@link CreditsHUD}. */
interface CreditsHUDProps {
  /** Seconds left in the credits track, or `null` once it's silent. */
  audioRemainingSec: number | null
  /** Leaves the credits scene. */
  onExit: () => void
}

/** One revealable line of the roll. */
interface Segment {
  kind: 'heading' | 'subheading' | 'section' | 'member'
  text: string
  /** Whether this member line gets the leader's shimmering writing animation. */
  isLeader: boolean
  /** Extra effect behind the line's letters. */
  effect?: 'soundBars'
}

/** Letters revealed per second by the typewriter. */
const CHARS_PER_SECOND = 26

/**
 * @param seconds - Seconds remaining
 * @returns `m:ss`
 */
function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * The full team roll, typed on letter by letter down the left edge once the
 * cinematic opening is over (leaders shimmer in gold as their name is
 * written; the sound designer's name pulses over equalizer bars).
 * @returns Roll column
 */
function CreditsRoll() {
  const segments = useMemo<Segment[]>(
    () => [
      { kind: 'heading', text: CREDITS_HEADING, isLeader: false },
      { kind: 'subheading', text: CREDITS_SUBHEADING, isLeader: false },
      ...CREDITS_ROLL.flatMap((section) => [
        { kind: 'section' as const, text: section.title, isLeader: false },
        ...section.members.map((m) => ({
          kind: 'member' as const,
          text: m.role ? `${m.name} — ${m.role}` : m.name,
          isLeader: m.role === CREDITS_LEADER_ROLE,
          effect: m.effect,
        })),
      ]),
    ],
    []
  )
  const totalLength = useMemo(() => segments.reduce((sum, s) => sum + s.text.length, 0), [segments])
  const revealed = useTypewriterProgress(totalLength, CHARS_PER_SECOND)

  let consumed = 0
  const rendered = segments.map((seg, i) => {
    const start = consumed
    const visible = Math.max(0, Math.min(seg.text.length, revealed - start))
    consumed += seg.text.length
    return { kind: seg.kind, isLeader: seg.isLeader, effect: seg.effect, text: seg.text.slice(0, visible), isTyping: visible > 0 && visible < seg.text.length, key: i }
  })

  return (
      <div className="pointer-events-none fixed top-10 bottom-24 left-8 z-10 w-75 overflow-hidden font-cinzel text-parchment">
        {rendered.map((seg) => {
          if (!seg.text && seg.kind !== 'member') return null
          if (seg.kind === 'heading') {
            return (
              <div key={seg.key} className="mb-1 text-[20px] tracking-[0.08em] text-gold-bright drop-shadow-[0_2px_16px_rgba(255,183,3,0.4)]">
                {seg.text}
              </div>
            )
          }
          if (seg.kind === 'subheading') {
            return (
              <div key={seg.key} className="mb-4 text-[11px] tracking-[0.3em] uppercase text-parchment/50">
                {seg.text}
              </div>
            )
          }
          if (seg.kind === 'section') {
            return (
              <div key={seg.key} className="mt-4 text-[12px] font-semibold tracking-[0.2em] uppercase text-gold">
                {seg.text}
              </div>
            )
          }
          if (!seg.text) return null
          return (
            <div
              key={seg.key}
              className={`relative isolate mt-1 w-fit text-[13px] ${seg.isLeader ? 'font-semibold tracking-[0.01em]' : 'text-parchment/85'}`}
              style={
                seg.isLeader
                  ? {
                      backgroundImage: 'linear-gradient(90deg, #c9a86a, #fff3d8, #ffcc33, #c9a86a)',
                      backgroundSize: '220% auto',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      animation: 'credits-leader-shine 2.4s linear infinite',
                    }
                  : undefined
              }
            >
              {seg.effect === 'soundBars' ? <EqualizerText text={seg.text} fontSize={13} fontWeight={600} /> : seg.text}
              {seg.isTyping && <span className="ml-0.5 inline-block w-1.5 bg-gold-bright align-middle" style={{ height: '1em', animation: 'credits-caret-blink 0.9s steps(1) infinite' }} />}
            </div>
          )
        })}
      </div>
  )
}

/**
 * The credits scene's overlay: the cinematic team-by-team opening, then the
 * team roll typed on letter by letter down the left edge; the Libro de Rosa
 * panel on the right (the book itself, a line about memory, the dedication
 * and the partners' logos); the music box bottom-left with an equalizer
 * moving to the track; and the way back out bottom-right.
 *
 * @param props - Track countdown and the exit action
 * @returns Overlay elements
 */
export const CreditsHUD = memo(function CreditsHUD({ audioRemainingSec, onExit }: CreditsHUDProps) {
  const [cinematicDone, setCinematicDone] = useState(false)
  const finishCinematic = useCallback(() => setCinematicDone(true), [])

  const showCountdown = typeof audioRemainingSec === 'number' && Number.isFinite(audioRemainingSec) && audioRemainingSec > 0.35
  const remainingSec = showCountdown ? Math.ceil(audioRemainingSec as number) : 0

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-5 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.6)_100%)]" />

      {cinematicDone ? <CreditsRoll /> : <CinematicCredits onDone={finishCinematic} />}

      <div className="pointer-events-none fixed top-10 bottom-24 right-8 z-10 flex w-80 flex-col items-end justify-end text-right font-cinzel text-parchment">
        <div className="relative w-full overflow-hidden rounded-2xl p-px" style={{ animation: 'start-rise 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) 0.3s both' }}>
          <div
            className="absolute -inset-1/2 bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,204,85,0.9)_12%,transparent_28%,rgba(168,85,255,0.7)_55%,transparent_72%)]"
            style={{ animation: 'spin 9s linear infinite' }}
          />
          <div className="relative flex flex-col items-center rounded-2xl bg-[#0b0814]/88 px-5 pt-3 pb-5 text-center backdrop-blur-md">
            <div className="relative h-32 w-32" style={{ animation: 'start-rise 1s cubic-bezier(0.2, 0.7, 0.2, 1) 0.6s both' }}>
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
            <div className="flex items-center gap-2 text-gold-bright" style={{ animation: 'start-rise 0.9s ease-out 0.9s both' }}>
              <FiBookOpen className="h-4 w-4" />
              <span className="text-[15px] tracking-widest">{CREDITS_BOOK_HEADING}</span>
            </div>
            <p
              className="mt-3 bg-linear-to-r from-[#ffe6a8] via-[#fff3d8] to-[#ffcc33] bg-size-[200%_auto] bg-clip-text text-[14px] leading-relaxed text-transparent italic"
              style={{ animation: 'start-rise 1s ease-out 1.2s both, start-shimmer 7s linear 2s infinite' }}
            >
              “{CREDITS_BOOK_QUOTE}”
            </p>
            <div className="my-3 h-px w-2/3 bg-linear-to-r from-transparent via-gold/60 to-transparent" style={{ animation: 'start-rise 0.8s ease-out 1.5s both' }} />
            <p className="text-[12px] leading-relaxed text-parchment/70" style={{ animation: 'start-rise 0.9s ease-out 1.7s both' }}>
              {CREDITS_BOOK_DEDICATION}
            </p>
            <p className="mt-1.5 text-[14px] tracking-[0.04em] text-gold-bright drop-shadow-[0_0_12px_rgba(255,204,51,0.45)]" style={{ animation: 'start-rise 0.9s ease-out 2s both' }}>
              {CREDITS_BOOK_AUTHOR}
            </p>
            <span className="mt-4 text-[9px] tracking-[0.32em] uppercase text-parchment/40" style={{ animation: 'start-rise 0.8s ease-out 2.3s both' }}>
              Con el apoyo de
            </span>
            <div className="mt-2">
              <PartnerLogos tileClassName="h-11 w-[5.5rem]" entranceDelay={2.5} />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-6 z-10 overflow-hidden rounded-xl border border-gold/20 bg-black/55 backdrop-blur-md">
        <LiveEqualizer source="phase" bars={28} className="absolute inset-x-2 top-2 bottom-0 opacity-45" />
        <div className="relative flex items-center gap-3 px-4 py-3">
          <FiMusic className="h-4 w-4 text-gold" style={{ animation: 'start-halo 1.2s ease-in-out infinite' }} />
          <div className="flex flex-col">
            <span className="text-[11px] tracking-[0.14em] uppercase text-parchment/80">
              {showCountdown ? `Faltan ${formatClock(remainingSec)}` : 'Música de créditos'}
            </span>
            <span className="text-[11px] text-parchment/60">{CREDITS_MUSIC_BY}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onExit}
        className="pointer-events-auto fixed bottom-6 right-6 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[11px] tracking-[0.14em] uppercase text-parchment/70 backdrop-blur-md hover:bg-black/60"
      >
        <FiX className="h-3.5 w-3.5" /> ESC — Volver
      </button>
    </>
  )
})
