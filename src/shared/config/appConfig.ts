/**
 * Central application configuration.
 * @module shared/config/appConfig
 */

import type { Bounds } from '@/shared/types'

/**
 * Player movement configuration.
 */
export const playerConfig = {
  /** Normal walk speed in units per second. */
  walkSpeed: 2.8,
  /** Sprint speed in units per second. */
  sprintSpeed: 4.5,
  /** Camera height above ground. */
  eyeHeight: 1.7,
  /** Starting position when entering the library. */
  startPosition: { x: 0, y: 1.7, z: 9 } as const,
  /** Starting look-at target. */
  startLookAt: { x: 0, y: 1.2, z: 0 } as const,
  /** Interaction distance to trigger the book. */
  interactDistance: 2.4,
  /** Collision radius around the central pedestal. */
  pedestalRadius: 1.05,
  /** Movement bounds inside the library hall. */
  libraryBounds: { minX: -9.2, maxX: 9.2, minZ: -9.2, maxZ: 9.2 } as Bounds,
  /** Movement bounds inside the museum hall. */
  museumBounds: { minX: -11.5, maxX: 11.5, minZ: -11.5, maxZ: 11.5 } as Bounds,
  /** Movement bounds inside Phase 1 barrio (larger, open). */
  phase1Bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 } as Bounds,
  /** Movement bounds inside Phase 2 barrio (colorful facades). */
  phase2Bounds: { minX: -18, maxX: 18, minZ: -18, maxZ: 18 } as Bounds,
} as const

/**
 * City intro (Escena -1: prologue walk) configuration.
 */
export const cityIntroConfig = {
  /** Constant forward speed along the walk path, in units per second. */
  walkSpeed: 2.6,
  /** Camera eye height while walking the street. */
  eyeHeight: 1.75,
  /** Progress in [0,1] along the path at which the player can enter the library. */
  arrivalThreshold: 0.985,
  /** Minimum time the Start button's loading spinner shows before the city scene reveals, in ms. */
  launchDelayMs: 650,
  /** Hard cap on how long the spinner waits for city assets to preload before revealing anyway, in ms. */
  launchMaxWaitMs: 5000,
} as const

/**
 * Wormhole transition configuration.
 */
export const wormholeConfig = {
  /** Duration of the wormhole sequence in milliseconds. */
  durationMs: 11000,
  /** Camera FOV interpolation targets. */
  fov: { from: 74, to: 112, lerp: 0.08 },
  /** Number of torus rings in the tunnel. */
  ringCount: 46,
  /** Number of star streak points. */
  starCount: 520,
  /** Camera shake amplitude scaling. */
  shake: { x: 0.08, y: 0.06 },
} as const

/**
 * Rendering and performance tuning.
 */
export const renderConfig = {
  /** Default DPR range for adaptive performance. */
  dpr: [1, 1.8] as [number, number],
  /** Shadow map sizes. */
  shadows: { pedestal: 1024, museum: 2048 },
  /** Antialias and tone mapping defaults. */
  gl: { antialias: true },
} as const

/**
 * Global application configuration aggregating domain settings.
 */
export const appConfig = {
  player: playerConfig,
  cityIntro: cityIntroConfig,
  wormhole: wormholeConfig,
  render: renderConfig,
} as const

export type AppConfig = typeof appConfig
