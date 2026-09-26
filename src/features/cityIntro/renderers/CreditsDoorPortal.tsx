/**
 * The always-visible portal marking the credits door in front of RIWI
 * Barranquilla — unlike `StoryPortal` (summoned dynamically in front of the
 * player), this one sits fixed at `CREDITS_DOOR_XZ` so it reads from a
 * distance as the player approaches down the side street; the interact
 * prompt (`PortalPrompt` in `CityIntroHUD`) still only shows once they're in
 * range.
 * @module features/cityIntro/renderers/CreditsDoorPortal
 */

import { memo } from 'react'
import { ProceduralPortal } from '@/shared/components/ReusableModels'
import {
  CREDITS_DOOR_XZ,
  CREDITS_PORTAL_ACCENT,
  CREDITS_PORTAL_GLOW,
  CREDITS_PORTAL_RADIUS,
  CREDITS_PORTAL_Y,
} from '@/features/credits/config/creditsConfig'

export const CreditsDoorPortal = memo(function CreditsDoorPortal() {
  return (
    <ProceduralPortal
      position={[CREDITS_DOOR_XZ[0], CREDITS_PORTAL_Y, CREDITS_DOOR_XZ[1]]}
      radius={CREDITS_PORTAL_RADIUS}
      accentColor={CREDITS_PORTAL_ACCENT}
      glowColor={CREDITS_PORTAL_GLOW}
      label="Portal a la escena de créditos"
      castsLight={false}
    />
  )
})
