/**
 * Public asset path helpers for JSON-authored media (images/videos) so entity
 * fields can use root-relative paths (`/videos/cityIntro/first.mp4`) that
 * still resolve correctly under the Vite `base` used by the GitHub Pages build.
 * @module shared/utils/media
 */

const base = import.meta.env.BASE_URL

/** Default riwi banner logo, used by `logo-tower` entities that omit `imageSrc`. */
export const RIWI_LOGO_SRC = `${base}images/riwi-logo.svg`

/**
 * Resolves a JSON-authored media path against the app's base URL.
 * Absolute URLs and paths already under `base` pass through unchanged.
 * @param src - Root-relative public path, absolute URL, or `undefined`
 * @returns Base-prefixed path, or `undefined` when `src` is empty
 */
export function resolvePublicSrc(src: string | undefined): string | undefined {
  if (!src) return undefined
  if (/^(https?:)?\/\//.test(src) || src.startsWith(base)) return src
  return `${base}${src.replace(/^\//, '')}`
}
