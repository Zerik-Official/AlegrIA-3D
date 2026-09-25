/**
 * `riwi-building` entity renderer for the `cityIntro` scene — the 2050 riwi
 * headquarters, its front (+Z in model space) lit by a soft purple fill light.
 * @module features/cityIntro/renderers/RiwiBuildingRenderer
 */

import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'

/** Front face plane (model-local Z) — the source model is ~20.5 deep and centered. */
const FRONT_Z = 10.25

/**
 * @returns Building model plus its front fill light
 */
export function RiwiBuildingRenderer() {
  return (
    <>
      <ModelLoader
        src={modelRegistry['cityIntro/riwi-building'].path}
        fallback={
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[31, 6, 20]} />
            <meshStandardMaterial color="#2a2c36" roughness={0.7} />
          </mesh>
        }
      />
      <pointLight position={[0, 4, FRONT_Z + 6]} intensity={1.6} distance={22} color="#b98cff" decay={2} />
    </>
  )
}