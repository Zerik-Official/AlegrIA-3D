/**
 * Whether models rendered below may publish their colliders to the shared
 * collision world. Off inside isolated previews (the editor's collider
 * modal) so a second copy of an entity doesn't replace — and on close remove —
 * the colliders its scene copy registered under the same id.
 * @module features/player/CollisionPublishContext
 */

import { createContext } from 'react'

export const CollisionPublishContext = createContext(true)
