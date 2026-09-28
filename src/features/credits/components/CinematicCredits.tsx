/**
 * Movie-style opening of the credits: each team's title ("Equipo de …")
 * slams in and stays while its members' names crash in one at a time from
 * the right, letter by letter, hold for a moment and fly out; then the title
 * leaves and the next team comes in.
 * @module features/credits/components/CinematicCredits
 */

import { memo, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CREDITS_LEADER_ROLE, CREDITS_ROLL, CREDITS_SECTION_PREFIX, type CreditMember } from '@/features/credits/config/creditsConfig'
import { EqualizerText } from '@/features/credits/components/EqualizerText'

/** Props for {@link CinematicCredits}. */
interface CinematicCreditsProps {
  /** Called once the last team has left. */
  onDone: () => void
}

/** Seconds between a title landing and its first member arriving. */
const TITLE_LEAD_S = 1
/** Seconds each member holds the screen, exit included. */
const MEMBER_SLOT_S = 2.6
/** Seconds a member's (or title's) fly-out takes. */
const EXIT_S = 0.4
/** Seconds between a title leaving and the next one arriving. */
const SECTION_GAP_S = 0.35
/** Seconds between consecutive letters landing. */
const LETTER_STAGGER_S = 0.035
/** Seconds one letter's slam takes. */
const LETTER_SLAM_S = 0.55
/** Font size of a name drawn with the equalizer fill, in px. */
const SOUND_BARS_FONT_PX = 56
/** How often the schedule is sampled, in ms. */
const TICK_MS = 50

/** One team's window in the schedule. */
interface SectionWindow {
  start: number
  end: number
}

/** What the screen shows at a given moment. */
interface Beat {
  section: number
  titleLeaving: boolean
  member: number | null
  memberLeaving: boolean
}

/**
 * @returns Start/end second of every team's window, back to back
 */
function buildSchedule(): SectionWindow[] {
  let t = 0
  return CREDITS_ROLL.map((section) => {
    const start = t
    const end = start + TITLE_LEAD_S + section.members.length * MEMBER_SLOT_S + EXIT_S
    t = end + SECTION_GAP_S
    return { start, end }
  })
}

/**
 * @param schedule - Team windows
 * @param elapsed - Seconds since the sequence started
 * @returns The beat on screen, or `null` once the sequence is over
 */
function beatAt(schedule: SectionWindow[], elapsed: number): Beat | null {
  for (let i = 0; i < schedule.length; i++) {
    const { start, end } = schedule[i]
    if (elapsed >= end + SECTION_GAP_S) continue
    if (elapsed < start) return { section: i, titleLeaving: false, member: null, memberLeaving: false }
    const local = elapsed - start - TITLE_LEAD_S
    const members = CREDITS_ROLL[i].members.length
    const slot = Math.floor(local / MEMBER_SLOT_S)
    const inSlot = local - slot * MEMBER_SLOT_S
    const member = local >= 0 && slot < members ? slot : null
    return {
      section: i,
      titleLeaving: elapsed >= end - EXIT_S,
      member,
      memberLeaving: member !== null && inSlot >= MEMBER_SLOT_S - EXIT_S,
    }
  }
  return null
}

/**
 * Props for {@link SlamText}.
 */
interface SlamTextProps {
  /** Text to slam in. */
  text: string
  /** Classes of the line. */
  className: string
  /** Whether the line is flying out. */
  leaving: boolean
  /** Extra effect on the letters: `soundBars` fills them with a live equalizer, the line slamming in as one block. */
  effect?: CreditMember['effect']
}

/**
 * A line whose extruded, gilded letters crash in from the right one after
 * another, the whole line jolting on impact.
 * @param props - Text, style, exit flag and effect
 * @returns Animated line
 */
function SlamText({ text, className, leaving, effect }: SlamTextProps) {
  const letters = useMemo(() => Array.from(text), [text])
  const impactDelay = letters.length * LETTER_STAGGER_S + LETTER_SLAM_S * 0.7
  const lineStyle: CSSProperties = {
    perspective: '800px',
    animation: leaving ? `credits-slam-out ${EXIT_S}s cubic-bezier(0.6, 0, 0.9, 0.4) both` : `credits-impact 0.45s ease-out ${impactDelay}s both`,
  }

  return (
    <div className={`relative isolate inline-block whitespace-nowrap ${className}`} style={lineStyle}>
      {effect === 'soundBars' ? (
        <span className="inline-block" style={{ animation: `credits-slam ${LETTER_SLAM_S}s cubic-bezier(0.16, 1.35, 0.35, 1) both` }}>
          <EqualizerText text={text} fontSize={SOUND_BARS_FONT_PX} letterSpacing={2} />
        </span>
      ) : (
        letters.map((letter, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              animation: `credits-slam ${LETTER_SLAM_S}s cubic-bezier(0.16, 1.35, 0.35, 1) ${i * LETTER_STAGGER_S}s both`,
              textShadow:
                '1px 1px 0 #b8862a, 2px 2px 0 #9c6f1f, 3px 3px 0 #825a17, 4px 4px 0 #6a4812, 5px 5px 0 #53380e, 6px 7px 14px rgba(0,0,0,0.65), 0 0 24px rgba(255,204,51,0.35)',
            }}
          >
            {letter === ' ' ? ' ' : letter}
          </span>
        ))
      )}
    </div>
  )
}

/**
 * @param props - Completion callback
 * @returns Title and current name, centered on the left half of the screen
 */
export const CinematicCredits = memo(function CinematicCredits({ onDone }: CinematicCreditsProps) {
  const schedule = useMemo(() => buildSchedule(), [])
  const [beat, setBeat] = useState<Beat | null>(() => beatAt(schedule, 0))

  useEffect(() => {
    const start = performance.now()
    const id = window.setInterval(() => {
      const next = beatAt(schedule, (performance.now() - start) / 1000)
      setBeat((prev) =>
        prev && next && prev.section === next.section && prev.member === next.member && prev.titleLeaving === next.titleLeaving && prev.memberLeaving === next.memberLeaving
          ? prev
          : next
      )
      if (!next) {
        window.clearInterval(id)
        onDone()
      }
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [schedule, onDone])

  if (!beat) return null
  const section = CREDITS_ROLL[beat.section]
  const member = beat.member !== null ? section.members[beat.member] : null

  return (
    <div className="pointer-events-none fixed top-1/2 left-[6vw] z-10 flex max-w-[46vw] -translate-y-1/2 flex-col items-start gap-5 font-cinzel text-[#fff3d8]">
      <SlamText
        key={`title-${beat.section}`}
        text={`${CREDITS_SECTION_PREFIX} ${section.title}`}
        leaving={beat.titleLeaving}
        className="text-[clamp(22px,3.2vw,44px)] font-semibold tracking-[0.12em] uppercase text-gold-bright"
      />
      {member && (
        <div className="flex flex-col items-start gap-2 pl-1">
          <SlamText
            key={`member-${beat.section}-${beat.member}`}
            text={member.name}
            leaving={beat.memberLeaving}
            effect={member.effect}
            className="text-[clamp(30px,4.6vw,64px)] font-semibold tracking-[0.04em]"
          />
          {member.role && (
            <span
              key={`role-${beat.section}-${beat.member}`}
              className={`rounded-full border px-3 py-1 text-[12px] tracking-[0.3em] uppercase ${
                member.role === CREDITS_LEADER_ROLE ? 'border-gold-bright/60 bg-gold-bright/15 text-gold-bright' : 'border-parchment/30 bg-black/30 text-parchment/80'
              }`}
              style={{ animation: beat.memberLeaving ? `credits-slam-out ${EXIT_S}s ease-in both` : 'credits-role-in 0.5s ease-out 0.6s both' }}
            >
              {member.role}
            </span>
          )}
        </div>
      )}
    </div>
  )
})
