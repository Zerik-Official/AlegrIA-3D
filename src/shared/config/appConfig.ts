/**
 * Central application configuration.
 * @module shared/config/appConfig
 */


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
  /** Player's body radius, used against the `COL_*`-driven collision world (see `features/player/collision`). */
  collisionRadius: 0.38,
  /** Tallest surface the player can step up onto unaided — anything higher blocks instead, so decks need their authored stairs or ramp. */
  stepUpHeight: 0.7,
  /** Standing height: colliders whose underside clears it pass overhead instead of blocking. */
  bodyHeight: 1.85,
  /** How quickly the camera settles to a new floor height when stepping up or down. */
  floorDamping: 11,
} as const

/**
 * Future city finale (Escena Final: the mototaxi ride) configuration.
 */
export const cityIntroConfig = {
  /** Cruising speed of the mototaxi along its route, in units per second. */
  walkSpeed: 2.4,
  /** Progress in [0,1] along the route at which the mototaxi counts as arrived and the player can get off. */
  arrivalThreshold: 0.985,
  /** Minimum time the Start button's loading spinner shows before the city scene reveals, in ms. */
  launchDelayMs: 650,
  /** Hard cap on how long the spinner waits for city assets to preload before revealing anyway, in ms. */
  launchMaxWaitMs: 5000,
} as const

/**
 * The Libro de Rosa's HUD companion in the open phases (Phase 1 and Phase 2):
 * how long it waits once the narration ends before asking the player to move
 * on, and how long each beat of its portal-summoning choreography lasts.
 */
export const storyBookConfig = {
  /** Idle time after the phase narration ends before the book grows restless, in ms. */
  waitAfterDialogMs: 60000,
  /** If the narration never reports a duration (missing/blocked audio), treat it as finished after this long in the phase, in ms. */
  dialogFallbackMs: 15000,
  /** Restless beat: brusque spin, cover bursting open, pages flipping, in ms. */
  restlessMs: 4200,
  /** Summoning beat: the book glides to the center of the screen and spins up, in ms. */
  summonMs: 2600,
  /** How long the "the book is channeling energy" title stays up once the narration ends, in ms. */
  channelingTitleMs: 6500,
  /** How long the "explore this era meanwhile" title that follows it stays up, in ms. */
  exploreTitleMs: 6000,
  /** How long the "portal opened" title stays up once the portal appears, in ms. */
  portalTitleMs: 6000,
} as const

/**
 * Phase 1's rain, which sets in towards the end of its narration.
 */
export const rainConfig = {
  /** Seconds left in Phase 1's narration at which the rain starts. */
  startAtRemainingSec: 25,
  /** How long the rain takes to build from a drizzle to full strength, in seconds. */
  buildUpSec: 7,
  /** Falling drops drawn around the player. */
  dropCount: 3200,
  /** Splash ripples drawn on the ground around the player. */
  splashCount: 240,
  /** Whether puddles reflect the scene (a second render of the scene every frame) — turn off on weak hardware. */
  puddleReflections: true,
  /** Loudness of the rain loop at full strength. */
  volume: 0.5,
} as const

/**
 * Wormhole transition configuration.
 */
export const wormholeConfig = {
  /** Duration of the wormhole sequence in milliseconds — matches `PART-2-VORTEX.mp3`'s length. */
  durationMs: 17000,
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
} as const

/**
 * Global application configuration aggregating domain settings.
 */
export const appConfig = {
  player: playerConfig,
  cityIntro: cityIntroConfig,
  storyBook: storyBookConfig,
  rain: rainConfig,
  wormhole: wormholeConfig,
  render: renderConfig,
} as const

