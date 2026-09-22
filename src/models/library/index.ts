/**
 * Library domain models.
 * Re-exports procedural implementations and documents Blender replacement workflow.
 * @module models/library
 *
 * To replace with Blender models:
 * 1. Export from Blender as `bookshelf.glb` / `scattered-book.glb` to `public/models/library/`.
 * 2. The registry in `shared/config/models.ts` already points there — no code change needed.
 * 3. Keep scale ~1 unit = 1 meter; apply transforms in Blender before export.
 * @link https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
 */

export { Bookshelf as ProceduralBookshelf } from '@/features/library/components/Bookshelf'
export { ScatteredBooks as ProceduralScatteredBooks } from '@/features/library/components/ScatteredBooks'
