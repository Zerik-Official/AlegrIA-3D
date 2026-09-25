/**
 * Whether a narration is being spoken right now, readable from anywhere —
 * including per-frame code inside the 3D scene — so ambient sounds (the ad
 * bus's video, say) can duck under the narrator instead of talking over them.
 * Written by `useExperience` from the narration countdown.
 * @module shared/audio/narrationState
 */

/** Live narration flag. */
export const narrationState = {
  /** Whether the narrator is currently speaking. */
  speaking: false,
}
