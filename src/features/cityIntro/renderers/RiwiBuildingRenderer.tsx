/**
 * `riwi-building` entity renderer for the `cityIntro` scene — the 2050 riwi
 * headquarters, its front (+Z in model space) washed by alternating white and
 * purple ground reflectors.
 * @module features/cityIntro/renderers/RiwiBuildingRenderer
 */

import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { Reflector } from '@/features/cityIntro/renderers/Reflector'

/** Front face plane (model-local Z) — the source model is ~20.5 deep and centered. */
const FRONT_Z = 10.25
/** Reflector X offsets along the facade (model-local; the model is ~31 wide). */
const REFLECTOR_XS = [-11.5, -4, 4, 11.5]
const REFLECTOR_COLORS = ['#ffffff', '#a855ff', '#ffffff', '#a855ff']

/**
 * @returns Building model plus its front reflectors
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
      {REFLECTOR_XS.map((x, i) => (
        <Reflector key={x} position={[x, 0.45, FRONT_Z + 2.8]} aimAt={[x * 0.8, 6, FRONT_Z]} color={REFLECTOR_COLORS[i]} intensity={70} />
      ))}
      <pointLight position={[0, 4, FRONT_Z + 6]} intensity={1.6} distance={22} color="#b98cff" decay={2} />
    </>
  )
}