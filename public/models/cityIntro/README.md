# City Intro models — Escena -1 (Calle de la Ciudad Futura, 2050)

Drop Blender `.glb` exports here to override procedural fallbacks without code changes.

| Registry key | File | Fallback |
|---|---|---|
| `cityIntro/skyscraper` | `skyscraper.glb` | boxy tower with lit-window facades |
| `cityIntro/streetlight` | `streetlight.glb` | pole + warm lamp head |
| `cityIntro/flying-car-retro` | `flyning-retro-car.glb` | low sporty hull with light trail |
| `cityIntro/flying-car-star` | `star-car.glb` | low sporty hull with light trail |
| `cityIntro/flying-car-classic` | `toyota-corolla.glb` | low sporty hull with light trail |
| `cityIntro/flying-train` | `flying-train.glb` | nosed multi-car maglev |
| `cityIntro/moon` | `moon.glb` | glowing sphere + halo |
| `cityIntro/library-facade` | `library-facade.glb` | weathered Republican-style facade with arcade, shutters and pediment |
| `cityIntro/planet` | `planet.glb` | banded, self-rotating distant planet |
| `cityIntro/logo-tower` | `logo-tower.glb` | boxy tower with a backlit riwi banner front and back |
| `cityIntro/ad-tower` | `ad-tower.glb` | boxy tower with a big video/ad screen and ticker band |

Each `flying-car-*` entity picks one of the three car hulls deterministically from its id, so a mix
shows up along the street without any JSON changes. `flying-car`/`flying-train` entities can also
set `title` to a lane id (see `flight-lane-point` in `engine/config/entityCatalog.ts`) to travel a
closed authored route above the street instead of orbiting their JSON anchor. `ad-tower` entities
can set `videoSrc` (e.g. `/videos/cityIntro/first.mp4`) to play a looped, muted video on their
screen instead of the generated neon ad pattern.

Export: Blender → File → Export → glTF 2.0 (.glb), Apply Modifiers, +Y Up.
