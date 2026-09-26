/**
 * On-demand model preloading for the editor: nothing is fetched until the
 * editor opens (its scene's models) or the model browser is switched to
 * every phase (the whole registry), so phase changes during play stay light.
 * @module features/editor/utils/preloadModels
 */

import { useGLTF, useProgress } from '@react-three/drei'
import type { SceneId } from '@/engine/config/entityCatalog'
import type { EditableEntity } from '@/engine/types'
import { modelRegistry } from '@/shared/config/models'

/** Cached `HEAD` checks, so each URL is probed once per session. */
const availability = new Map<string, Promise<boolean>>()
/** Longest the editor waits for models before letting the user in anyway. */
const PRELOAD_TIMEOUT_MS = 30000
/** How often loading progress is polled. */
const POLL_MS = 120

/**
 * @param url - Model URL
 * @returns Whether a real `.glb` is served there (not the SPA's HTML fallback)
 */
function isAvailable(url: string): Promise<boolean> {
  let check = availability.get(url)
  if (!check) {
    check = fetch(url, { method: 'HEAD' })
      .then((r) => r.ok && !(r.headers.get('content-type') ?? '').includes('text/html'))
      .catch(() => false)
    availability.set(url, check)
  }
  return check
}

/**
 * Resolves once three's default loading manager has gone idle, or after the timeout.
 * @returns Promise settled when loading is done
 */
function waitForIdle(): Promise<void> {
  const start = performance.now()
  return new Promise((resolve) => {
    const check = (): void => {
      if (!useProgress.getState().active || performance.now() - start > PRELOAD_TIMEOUT_MS) resolve()
      else window.setTimeout(check, POLL_MS)
    }
    window.setTimeout(check, POLL_MS)
  })
}

/**
 * Loads every model among `urls` that exists into drei's `useGLTF` cache.
 * @param urls - Model URLs, duplicates allowed
 * @returns Promise settled when they are all parsed (or the timeout hits)
 */
export async function preloadModels(urls: string[]): Promise<void> {
  const unique = [...new Set(urls)]
  const present = await Promise.all(unique.map(async (url) => ((await isAvailable(url)) ? url : null)))
  for (const url of present) if (url) useGLTF.preload(url)
  await waitForIdle()
}

/**
 * @param scene - Scene being edited
 * @param entities - Its entities, whose types or variants may name registry keys from any folder
 * @returns URLs of the models that scene can show
 */
export function sceneModelUrls(scene: SceneId, entities: EditableEntity[]): string[] {
  const registry = modelRegistry as Record<string, { path: string }>
  const urls = Object.entries(registry)
    .filter(([key]) => key.startsWith(`${scene}/`))
    .map(([, entry]) => entry.path)
  for (const entity of entities) {
    if (registry[entity.type]) urls.push(registry[entity.type].path)
    if (entity.variant && registry[entity.variant]) urls.push(registry[entity.variant].path)
  }
  return urls
}

/**
 * @returns URL of every model in the registry
 */
export function allModelUrls(): string[] {
  return Object.values(modelRegistry as Record<string, { path: string }>).map((entry) => entry.path)
}
