/**
 * Whether the editor draws every collider in the scene. Kept as a tiny
 * external store so each entity's collider can read it without threading a
 * prop through `PhaseEngine` and every scene.
 * @module features/editor/state/collisionDebug
 */

import { useSyncExternalStore } from 'react'

let visible = false
const listeners = new Set<() => void>()

/**
 * @param listener - Called whenever visibility changes
 * @returns Unsubscribe function
 */
function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * @returns Current visibility
 */
function getSnapshot(): boolean {
  return visible
}

/**
 * Shows or hides the collider view.
 * @param next - New visibility
 */
export function setCollisionDebugVisible(next: boolean): void {
  if (visible === next) return
  visible = next
  listeners.forEach((listener) => listener())
}

/**
 * @returns Whether colliders are currently drawn
 */
export function useCollisionDebugVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
