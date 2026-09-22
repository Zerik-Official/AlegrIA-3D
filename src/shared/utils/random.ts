/**
 * Deterministic pseudo-randomness helpers, used to give per-entity procedural
 * variety (building height, window pattern, ...) that stays stable across
 * re-renders without needing to memoize a `Math.random()` call by hand.
 * @module shared/utils/random
 */

/**
 * Hashes a string into a positive 32-bit integer seed.
 * @param str - Input string, typically an entity id
 * @returns Deterministic positive integer
 */
export function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/**
 * Creates a mulberry32 PRNG seeded from an integer, returning floats in [0,1).
 * Deterministic: the same seed always produces the same sequence.
 * @param seed - Integer seed, e.g. from {@link hashSeed}
 * @returns Generator function
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
