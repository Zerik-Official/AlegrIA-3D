# Phase 1 models — Barrio Abajo & Río Magdalena waterfront (1857-1900)

Drop Blender `.glb` exports here to override procedural fallbacks without code changes.
Every key below is registered in `src/shared/config/models.ts` and placed via
`src/engine/config/phase1.json` (edit live in the in-game editor, or by hand).

| Folder | Registry key prefix | What it is |
|---|---|---|
| *(root)* | `phase1/bahareque-house-*`, `phase1/anden-alto`, `phase1/sepia-photo`, `phase1/portal` | Small reusable pieces |
| `scenes/` | `phase1/scenes/*` | Self-contained set pieces (building + its own platform/stairs): `puerto-fluvial` (Aduana), `mini-puerto-barranquilla-1857` (boardwalk + houses + stairs), `estacion-montoya` (station, with its own platform/track) |
| `vehicles/` | `phase1/vehicles/*` | The train — `tren-completo`, `tren-locomotora`, `tren-coche`, `tren-vagon`. Wheel-rotation clips are baked in and played via `TrenAnimado` (see `phase1-train` entity type) |
| `floors/` | `phase1/floors/*` | Modular rail kit, 8m straight modules with `±X` connectors — `rieles-riel-recta/-media/-gastada`, `-curva`, `-curva-suave`, `-cruce`, `-desvio-der/-izq`, `-paso-nivel`, `-calle-recta/-curva`, `-tope` |
| `decorators/` | `phase1/decorators/*` | Port/dock props — barrels, crates, sacks, baskets, jars, boats, anchor, mooring posts, coconut palms, a river steamboat |

Export: Blender → File → Export → glTF 2.0 (.glb), Apply Modifiers, +Y Up.
