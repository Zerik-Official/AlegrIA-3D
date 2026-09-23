/**
 * Arroyo water material configuration for Phase 1.
 * @module features/phase1/config/arroyoWater
 */

/** Tunable uniforms for {@link ArroyoWater}'s shader. */
export interface ArroyoWaterConfig {
  /** Base water color near the banks. */
  colorNear: string
  /** Water color at the center of the channel. */
  colorFar: string
  /** Foam/wave noise scale (0-100, higher = finer texture). */
  textureSize: number
  /** Surface bob speed. */
  waveSpeed: number
  /** Surface bob height. */
  waveAmplitude: number
  /**
   * Fraction of the half-width (0-1, from center to bank) where the foam/wave
   * pattern starts fading into the flat bank color.
   */
  bankFadeStart: number
  /** Fraction of the half-width where the foam/wave pattern is fully faded out. */
  bankFadeEnd: number
}

/**
 * Defaults — foam/waves cover nearly the full channel width, fading only in
 * the last stretch before each bank.
 */
export const arroyoWaterConfig: ArroyoWaterConfig = {
  colorNear: '#2e2214',
  colorFar: '#6b5230',
  textureSize: 45,
  waveSpeed: 1.1,
  waveAmplitude: 0.03,
  bankFadeStart: 0.75,
  bankFadeEnd: 0.98,
}
