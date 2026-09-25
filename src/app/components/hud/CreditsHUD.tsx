import { memo, useMemo } from 'react'
import { FiBookOpen, FiMusic, FiX } from 'react-icons/fi'
import {
  CREDITS_BOOK_AUTHOR,
  CREDITS_BOOK_DEDICATION,
  CREDITS_BOOK_HEADING,
  CREDITS_HEADING,
  CREDITS_LEADER_ROLE,
  CREDITS_MUSIC_BY,
  CREDITS_ROLL,
  CREDITS_SUBHEADING,
} from '@/features/credits/config/creditsConfig'
import { useTypewriterProgress } from '@/features/credits/hooks/useTypewriterProgress'

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
 * The credits scene's overlay: the team roll typed on letter by letter down
 * the left edge (leaders shimmer in gold as their name is written), the book
 * dedication plaque on the right, the music box (time remaining + composer
 * credit) bottom-left, and the way back out bottom-right.
 *
 * @param props - Track countdown and the exit action
 * @returns Overlay elements
 */
export const CreditsHUD = memo(function CreditsHUD({ audioRemainingSec, onExit }: CreditsHUDProps) {
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
    return { kind: seg.kind, isLeader: seg.isLeader, text: seg.text.slice(0, visible), isTyping: visible > 0 && visible < seg.text.length, key: i }
  })

  const showCountdown = typeof audioRemainingSec === 'number' && Number.isFinite(audioRemainingSec) && audioRemainingSec > 0.35
  const remainingSec = showCountdown ? Math.ceil(audioRemainingSec as number) : 0

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-5 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.6)_100%)]" />

      <div className="pointer-events-none fixed top-10 bottom-24 left-8 z-10 w-[300px] overflow-hidden font-cinzel text-parchment">
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
              className={`mt-1 text-[13px] ${seg.isLeader ? 'font-semibold tracking-[0.01em]' : 'text-parchment/85'}`}
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
              {seg.text}
              {seg.isTyping && <span className="ml-0.5 inline-block w-[6px] bg-gold-bright align-middle" style={{ height: '1em', animation: 'credits-caret-blink 0.9s steps(1) infinite' }} />}
            </div>
          )
        })}
      </div>

      <div
        className="pointer-events-none fixed top-10 bottom-24 right-8 z-10 flex w-[280px] flex-col items-end justify-end text-right font-cinzel text-parchment"
        style={{ animation: 'credits-dedication-in 1.1s 0.4s both ease-out' }}
      >
        <div className="rounded-2xl border border-gold/25 bg-black/35 px-5 py-5 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-end gap-2 text-gold-bright">
            <span className="text-[15px] tracking-[0.1em]">{CREDITS_BOOK_HEADING}</span>
            <FiBookOpen className="h-4 w-4" />
          </div>
          <div className="h-px w-full bg-gradient-to-l from-gold/60 to-transparent" />
          <p className="mt-3 text-[12.5px] leading-relaxed text-parchment/75 italic">{CREDITS_BOOK_DEDICATION}</p>
          <p className="mt-2 text-[14px] tracking-[0.04em] text-gold-bright">{CREDITS_BOOK_AUTHOR}</p>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-6 z-10 flex items-center gap-3 rounded-xl border border-gold/20 bg-black/50 px-4 py-3 backdrop-blur-md">
        <FiMusic className="h-4 w-4 text-gold" />
        <div className="flex flex-col">
          <span className="text-[11px] tracking-[0.14em] uppercase text-parchment/60">
            {showCountdown ? `Faltan ${formatClock(remainingSec)}` : 'Música de créditos'}
          </span>
          <span className="text-[11px] text-parchment/45">{CREDITS_MUSIC_BY}</span>
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
