/**
 * Framework-agnostic `requestAnimationFrame` timeline.
 * Owns its own RAF handle so callers never juggle refs or manual cancellation —
 * instantiate once (e.g. `useRef(new WormholeTimeline())`) and call {@link start}/{@link cancel}.
 * @module app/engine/WormholeTimeline
 */
export class WormholeTimeline {
  private rafId: number | null = null

  /**
   * Starts (or restarts) an eased timeline, invoking `onTick` every frame with
   * eased progress and `onDone` once progress reaches 1.
   *
   * @param durationMs - Timeline duration in milliseconds
   * @param easing - Easing function applied to linear progress in [0,1]
   * @param onTick - Called every frame with eased progress
   * @param onDone - Called once when the timeline completes
   */
  start(durationMs: number, easing: (t: number) => number, onTick: (eased: number) => void, onDone: () => void): void {
    this.cancel()
    const startedAt = performance.now()
    const tick = (now: number): void => {
      const t = Math.min((now - startedAt) / durationMs, 1)
      onTick(easing(t))
      if (t < 1) {
        this.rafId = requestAnimationFrame(tick)
      } else {
        this.rafId = null
        onDone()
      }
    }
    this.rafId = requestAnimationFrame(tick)
  }

  /** Cancels any in-flight timeline; safe to call even when idle. */
  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
