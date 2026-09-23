/**
 * Periodic street flood configuration for Phase 1 — Barrio Abajo streets
 * used to flood a little below the knee every so often.
 * @module features/phase1/config/phase1Flood
 */

/** Tunable timing and material params for {@link Phase1Flood}. */
export interface Phase1FloodConfig {
  /** Seconds between the start of one flood and the next. */
  cycleSeconds: number
  /** Water surface Y at full flood — a little below knee height. */
  floodLevel: number
  /** Water surface Y while dry, kept beneath the ground plane. */
  hiddenLevel: number
  /** Seconds spent rising from `hiddenLevel` to `floodLevel`. */
  riseDuration: number
  /** Seconds the water stays at `floodLevel` before receding. */
  holdDuration: number
  /** Seconds spent receding from `floodLevel` back to `hiddenLevel`. */
  recedeDuration: number
  /** Side length of the square flood plane, centered on the map. */
  size: number
  /** Water color near the map's edge. */
  colorNear: string
  /** Water color toward the map's center. */
  colorFar: string
  /** Foam/wave noise scale (0-100, higher = finer texture). */
  textureSize: number
  /** Surface bob speed. */
  waveSpeed: number
  /** Surface bob height. */
  waveAmplitude: number
  /** Fraction of the map's half-size where the foam/wave pattern starts fading toward the edge. */
  edgeFadeStart: number
  /** Fraction of the map's half-size where the foam/wave pattern is fully faded out. */
  edgeFadeEnd: number
}

export const phase1FloodConfig: Phase1FloodConfig = {
  cycleSeconds: 17,
  floodLevel: 0.35,
  hiddenLevel: -0.6,
  riseDuration: 1.6,
  holdDuration: 2.4,
  recedeDuration: 2,
  size: 42,
  colorNear: '#2e2214',
  colorFar: '#6b5230',
  textureSize: 45,
  waveSpeed: 1.1,
  waveAmplitude: 0.03,
  edgeFadeStart: 0.85,
  edgeFadeEnd: 1.0,
}
