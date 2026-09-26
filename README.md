<h1 align="center">
  AlegrIA 3D
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/React-111111?style=for-the-badge&logo=react">
  <img src="https://img.shields.io/badge/TypeScript-111111?style=for-the-badge&logo=typescript">
  <img src="https://img.shields.io/badge/Vite-111111?style=for-the-badge&logo=vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-111111?style=for-the-badge&logo=tailwindcss">
  <img src="https://img.shields.io/badge/Three.js-111111?style=for-the-badge&logo=threedotjs">
  <img src="https://img.shields.io/badge/React_Three_Fiber-111111?style=for-the-badge&logo=threedotjs">
  <img src="https://img.shields.io/badge/Drei-111111?style=for-the-badge&logo=threedotjs">
  <img src="https://img.shields.io/badge/License-MIT-111111?style=for-the-badge">
</p>

<p align="center">
  <img src=".github/images/preview.png" alt="AlegrIA 3D Preview"/>
</p>

An immersive first-person 3D experience through the history of Barrio Abajo, Barranquilla — from an abandoned library in 2050 to the riverside of 1857 and the Golden Age of the early 20th century, guided by El Libro de Rosa. Built with React Three Fiber.

---

## Requirements

- Node.js 20.19+ (or 22.12+)
- npm 9+

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Zerik-Official/AlegrIA-3D
cd AlegrIA-3D
```

Create your environment file — `VITE_DEBUG=True` enables the in-game editor:

```bash
cp .env.example .env        # Linux / macOS
copy .env.example .env      # Windows
```

Install and run:

```bash
npm install
npm run dev
```

Available at `http://localhost:5173` (`npm run dev -- --host` to test on mobile).

---

## Controls

| Input | Action |
|---|---|
| WASD / Shift | Move / sprint |
| Mouse | Look around (click to lock) |
| E | Interact |
| ESC | Release pointer |

---

## Project Structure

Feature-based architecture — the engine renders JSON-authored scenes, each folder owns one game domain:

```
src/
├── app/           # Composition root: scene/player/editor rigs, HUD, phase & narration hooks
├── components/    # Shared UI primitives
├── engine/        # PhaseEngine — data-driven entity rendering, colliders & scene JSONs
├── features/
│   ├── library/     # The abandoned library and its restored counterpart (2050)
│   ├── phase1/      # Barrio Abajo & the Río Magdalena waterfront (1857–1900)
│   ├── phase2/      # Golden Age: carnival, baseball & trinitarias (1919–1950s)
│   ├── cityIntro/   # "Futurismo Abajero" street finale (2050)
│   ├── storyBook/   # El Libro de Rosa companion and the portal it summons
│   ├── cinematics/  # Wormhole and portal-crossing sequences
│   ├── player/      # First-person controls, collision world, walk areas
│   └── editor/      # The F2 in-game editor (entities, colliders, models)
├── models/        # ModelLoader with procedural fallback + shared 3D components
└── shared/        # Config, hooks, utils and reusable components

public/
├── models/        # Blender .glb assets, swappable without touching code
├── images/        # Book scans, logos and textures
├── videos/        # Screen-building & ad-bus loops
└── sounds/        # Narration and atmosphere audio
```

---

## In-Game Editor

Enabled with `VITE_DEBUG=True` and toggled with **F2**:

- **Entity editing** — add, select (Alt + right-click), move, rotate and scale any scene entity with a transform gizmo
- **Model browser** — preview and quick-add any registered `.glb` to the scene
- **Colliders & walk areas** — author box/cylinder colliders and walkable areas with a live collision debug view
- **Spawn placement** — new entities drop right where the crosshair points
- **Story checkpoints** — jump straight to any point of the story (library visits, phases, finale)
- **JSON export** — every scene serializes back to `engine/config/*.json`

---

## 3D Models (Blender)

Every procedural mesh can be swapped for a Blender asset without touching scene code:

1. Export from Blender: `File > Export > glTF 2.0 (.glb)` with `Apply Modifiers` and `+Y Up`
2. Drop it under `public/models/<scene>/` and reference it in `src/shared/config/models.ts`

If a file is missing, `ModelLoader` falls back to the procedural mesh automatically.

---

## Build

```bash
npm run build
npm run preview
```

Outputs `dist/` ready for GitHub Pages — `.github/workflows/deploy.yml` builds on every PR and publishes on every push to `main`. Lint with `npm run lint` (oxlint).

---

## License

Distributed under the [MIT](LICENSE) license.