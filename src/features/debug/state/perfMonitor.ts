/**
 * Debug performance monitor state: whether the overlay is shown and the
 * latest sampled numbers. Only toggled in debug builds (`VITE_DEBUG=True`),
 * see `HotkeyRouter`'s `ñ` binding.
 * @module features/debug/state/perfMonitor
 */

import { useSyncExternalStore } from 'react'

/** One sample of the renderer and memory numbers. */
export interface PerfSample {
  /** Frames rendered per second over the last window. */
  fps: number
  /** Average frame time over the last window, in ms. */
  frameMs: number
  /** Slowest frame in the last window, in ms. */
  worstFrameMs: number
  /** Used JS heap in MB, or `null` where the browser doesn't expose it (non-Chromium). */
  heapUsedMb: number | null
  /** JS heap limit in MB, or `null` where unavailable. */
  heapLimitMb: number | null
  /** Draw calls in the last rendered frame. */
  drawCalls: number
  /** Triangles in the last rendered frame. */
  triangles: number
  /** Geometries resident on the GPU. */
  geometries: number
  /** Textures resident on the GPU. */
  textures: number
  /** Compiled shader programs. */
  programs: number
}

let visible = false
let sample: PerfSample | null = null
const listeners = new Set<() => void>()

/** Notifies every subscriber. */
function emit(): void {
  listeners.forEach((listener) => listener())
}

/**
 * @param listener - Called on any change
 * @returns Unsubscribe function
 */
function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Shows or hides the monitor. */
export function togglePerfMonitor(): void {
  visible = !visible
  if (!visible) sample = null
  emit()
}

/**
 * Publishes a new sample; ignored while the monitor is hidden.
 * @param next - Latest numbers
 */
export function publishPerfSample(next: PerfSample): void {
  if (!visible) return
  sample = next
  emit()
}

/**
 * @returns Whether the monitor is shown
 */
export function usePerfMonitorVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => visible,
    () => false
  )
}

/**
 * @returns Latest sample, or `null` before the first one
 */
export function usePerfSample(): PerfSample | null {
  return useSyncExternalStore(
    subscribe,
    () => sample,
    () => null
  )
}