/**
 * Renderers for the sky elements every open-air scene can place through
 * JSON: the `sun` and each `cloud`. Their look comes from the named preset in
 * `engine/config/skyPresets.json` selected by `entity.variant`, so moving,
 * scaling or restyling them never needs code. Merged into
 * `engine/entityRegistry`'s `entityRegistry` export.
 * @module shared/renderers/skyRenderers
 */

import skyPresetsJson from '@/engine/config/skyPresets.json'
import { SceneCloud, SceneSun } from '@/shared/components/SceneAtmosphere'
import type { EntityRenderer, EntityRendererProps } from '@/engine/types'

/** Look and lighting of one sun preset. */
interface SunPreset {
  color: string
  glowColor: string
  intensity: number
  size: number
  castShadow: boolean
  disc: boolean
  hemisphere: { sky: string; ground: string; intensity: number } | null
  flareColor: string
}

/** Colors of one cloud preset. */
interface CloudPreset {
  color: string
  underColor: string
}

/** Sky presets, keyed by `entity.variant`. */
const skyPresets = skyPresetsJson as { sun: Record<string, SunPreset>; cloud: Record<string, CloudPreset> }

/** Preset used when an entity's variant names none. */
const DEFAULT_PRESET = 'phase1'

/**
 * Sun disc (unless the preset leaves it to the sky shader), its lights and a
 * lens flare seen when looking into it.
 * @param props - Entity props
 * @returns Sun group
 */
function SunRenderer({ entity }: EntityRendererProps) {
  const preset = skyPresets.sun[entity.variant ?? ''] ?? skyPresets.sun[DEFAULT_PRESET]
  return (
    <SceneSun
      position={[0, 0, 0]}
      color={preset.color}
      glowColor={preset.glowColor}
      intensity={preset.intensity}
      size={preset.size}
      castShadow={preset.castShadow}
      disc={preset.disc}
      hemisphere={preset.hemisphere}
      flareColor={preset.flareColor}
    />
  )
}

/**
 * One drifting cloud, shaped from the entity id.
 * @param props - Entity props
 * @returns Cloud group
 */
function CloudRenderer({ entity }: EntityRendererProps) {
  const preset = skyPresets.cloud[entity.variant ?? ''] ?? skyPresets.cloud[DEFAULT_PRESET]
  return (
    <group userData={{ editorIgnore: true }}>
      <SceneCloud seed={entity.id} color={preset.color} underColor={preset.underColor} />
    </group>
  )
}

export const skyRenderers: Record<string, EntityRenderer> = {
  sun: SunRenderer,
  cloud: CloudRenderer,
}
