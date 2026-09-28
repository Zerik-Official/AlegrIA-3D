/**
 * Subscribes a single `keydown` listener for the app's lifetime and dispatches
 * every event through {@link HotkeyRouter}. The context is kept in a ref so the
 * listener is registered once, instead of re-subscribing on every state change.
 * @module app/hooks/useHotkeys
 */

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { HotkeyRouter, type HotkeyContext } from '@/app/engine/HotkeyRouter'

/**
 * Wires {@link HotkeyRouter} to `window`'s `keydown` event.
 * @param ctx - Fresh context snapshot, recomputed every render
 */
export function useHotkeys(ctx: HotkeyContext): void {
  const ctxRef = useRef(ctx)
  useLayoutEffect(() => {
    ctxRef.current = ctx
  })
  const router = useMemo(() => new HotkeyRouter(), [])

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => router.handle(event, ctxRef.current)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])
}
