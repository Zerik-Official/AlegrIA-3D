/**
 * Debug/editor flag — only `true` when `.env` contains `VITE_DEBUG=True`.
 * Vite exposes env vars as strings; when `.env` is absent the variable is
 * `undefined` so this defaults to `false`.
 * @module shared/config/debug
 */

export const isDebugEnabled: boolean =
  (import.meta.env as Record<string, string | undefined>).VITE_DEBUG === 'True' ||
  (import.meta.env as Record<string, string | undefined>).VITE_DEBUG === 'true'
