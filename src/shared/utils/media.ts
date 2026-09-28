/**
 * Public asset path helpers for JSON-authored media (images/videos) so entity
 * fields can use root-relative paths (`/videos/cityIntro/first.mp4`) that
 * still resolve correctly under the Vite `base` used by the GitHub Pages build.
 * @module shared/utils/media
 */

const base = import.meta.env.BASE_URL

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

/**
 * Resolves each entry of a JSON-authored media path list against the app's base URL.
 * @param srcs - Root-relative public paths, absolute URLs, or `undefined`
 * @returns Base-prefixed paths, or `undefined` when `srcs` is empty/undefined
 */
export function resolvePublicSrcs(srcs: string[] | undefined): string[] | undefined {
  if (!srcs || srcs.length === 0) return undefined
  return srcs.map((s) => resolvePublicSrc(s)!).filter(Boolean)
}
