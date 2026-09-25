/**
 * Ambient/cue soundtrack registry — one track per stretch of the experience.
 * @module shared/config/audio
 */

const base = import.meta.env.BASE_URL

/**
 * Public URL for each named track under `public/sounds/`.
 */
export const audioTracks = {
  /** Library, first visit. */
  alegria: `${base}sounds/PART-1-ALERGRIA.mp3`,
  /** Every wormhole/portal crossing — 17s, matches `wormholeConfig.durationMs`. */
  vortex: `${base}sounds/PART-2-VORTEX.mp3`,
  /** Phase 1 — Barrio Abajo. */
  origins: `${base}sounds/PART-3-ORIGINS.mp3`,
  /** Phase 2 — Época Dorada. */
  dorade: `${base}sounds/PART-4-DORADE.mp3`,
  /** Library, second visit (returning from Phase 2). */
  present: `${base}sounds/PART-5-PRESENT.mp3`,
  /** City intro, reached as the finale via the book's second use. */
  finalFuture: `${base}sounds/PART-6-FINAL-FUTURE.mp3`,
} as const

/** A key into {@link audioTracks}. */
export type AudioTrackKey = keyof typeof audioTracks

/**
 * Looping ambience layered under the narration, each driven by its own hook
 * rather than the single narration track.
 */
export const ambienceTracks = {
  /** Phase 1's rain. */
  rain: `${base}sounds/atmosphere/SOUND-RAIN.mp3`,
} as const
