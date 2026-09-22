/**
 * Pure distance helpers shared by the player proximity hook.
 * @module app/engine/proximity
 */

import type { SepiaPhotoConfig } from '@/features/phase1/config/sepiaPhotos'

/**
 * Finds the closest sepia photo to a point on the XZ ground plane, within range.
 * @param x - Point X
 * @param z - Point Z
 * @param photos - Candidate photos
 * @param maxDistance - Photos farther than this are ignored
 * @returns Id of the nearest photo in range, or null
 */
export function findNearestSepiaPhoto(x: number, z: number, photos: SepiaPhotoConfig[], maxDistance: number): string | null {
  let nearest: string | null = null
  let min = maxDistance
  for (const photo of photos) {
    const dx = x - photo.position[0]
    const dz = z - photo.position[2]
    const dist = Math.hypot(dx, dz)
    if (dist < min) {
      min = dist
      nearest = photo.id
    }
  }
  return nearest
}
