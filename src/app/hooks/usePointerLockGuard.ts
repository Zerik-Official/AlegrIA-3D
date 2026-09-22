/**
 * Forces the browser out of pointer lock whenever the canvas is covered by
 * UI that should own the cursor (an intro overlay, the idle screen, the editor).
 * @module app/hooks/usePointerLockGuard
 */

import { useEffect } from 'react'

/**
 * @param shouldUnlock - True while pointer lock must not be held
 */
export function usePointerLockGuard(shouldUnlock: boolean): void {
  useEffect(() => {
    if (shouldUnlock && document.pointerLockElement) {
      document.exitPointerLock()
    }
  }, [shouldUnlock])
}
