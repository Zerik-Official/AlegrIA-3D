/**
 * Renderer map for the sky entity types every open-air scene can place
 * (`sun`, `cloud`), merged into `engine/entityRegistry`'s `entityRegistry` export.
 * @module shared/renderers/skyRenderers
 */

import { CloudRenderer, SunRenderer } from '@/shared/renderers/SkyEntityRenderers'
import type { EntityRenderer } from '@/engine/types'

export const skyRenderers: Record<string, EntityRenderer> = {
  sun: SunRenderer,
  cloud: CloudRenderer,
}
