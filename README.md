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
  <img src="https://img.shields.io/badge/Oxlint-111111?style=for-the-badge&logo=oxc">
</p>

<p align="center">
  <img src=".github/images/preview.png" alt="AlegrIA 3D Preview"/>
</p>

AlegrIA 3D is an immersive 3D web experience set inside a time library. You spawn in an abandoned library, explore in first person with **WASD + mouse look**, approach the levitating book on the central pedestal and cross a **No Man's Sky-inspired hyperspace vortex** to awaken inside the **Museum of Time**, a marble hall with columns, paintings and explorable display cases.

---

## Features

- **Abandoned library** with procedural bookshelves, point-light torches, parquet floor and vaulted beams; scattered books tell the story of abandonment without physics.
- **Central pedestal** with animated golden inlay rings and point light; the book levitates with sinusoidal bobbing, rotation and floating runes.
- **Levitating book** with particle aura, pulsating glow volume, half-open cover with golden sigil and emissive light that illuminates the room.
- **NMS vortex** with 46 toroidal rings in a gold→cyan→purple gradient, 520 streaking stars at `progress*3.5`, core flash, additive tunnel cylinder and chromatic rim; camera FOV `74→112` with random shake.
- **Museum of Time** with marble floor, emissive skylight, beams, light walls, 6 columns, 6 paintings with random hue and golden frames, and 5 self-lit display pedestals.
- **First-person controls** with `PointerLockControls`, `WASD + Shift` to sprint, cylindrical pedestal collision and per-room bounds, and footstep synthesis via Web Audio API with no external files.
- **Immersive HUD** with vignette, crosshair, top bar with controls legend, pulsating `E` prompt when near (`distance < 2.4m`), distance readout and radial overlay during the vortex.
- **Phase machine** `idle → exploring → wormhole → museum` with `StartOverlay` and `PastOverlay`; museum re-entry keeps controls locked until the intro is dismissed and offers a button to return to the library.
- **Decoupled Blender pipeline**: any procedural mesh can be swapped for a `.glb` under `public/models/` without touching scene code, with automatic fallback via `ModelLoader` and a central registry in `shared/config/models.ts`.
- **GitHub Pages deployment** with `base: '/AlegrIA-3D/'` and a workflow that builds and publishes on every PR to `main`, with a `404.html` fallback for SPA routing.

---

## Architecture

Monorepo `Vite + React 18 + TypeScript 6 + Three.js 0.160` with feature-based architecture and centralized config. Frontend `Tailwind CSS 4 + @tailwindcss/vite` for the HUD (no vanilla CSS except theme vars), `@react-three/fiber 8.15 + @react-three/drei 9.88` for declarative 3D and `react-icons` for `Fi/Lu` icons.

```
src/
├── app/App.tsx                 # phase machine + WormholeCamera + KeyListener
├── features/
│   ├── library/                # LibraryScene + Bookshelf + ScatteredBooks
│   ├── pedestal/               # Pedestal + LevitatingBook (with ModelLoader)
│   ├── museum/                 # MuseumScene (columns, paintings, pedestals)
│   ├── wormhole/               # Wormhole (rings + stars)
│   ├── player/                 # PlayerControls + useKeyboard + useFootsteps
│   └── ui/                     # HUD, StartOverlay, PastOverlay (memo + JSDoc)
├── models/
│   ├── shared/ModelLoader.tsx  # generic useGLTF + HEAD check + fallback loader
│   ├── library/                # re-exports ProceduralBookshelf/ScatteredBooks
│   ├── pedestal/               # re-exports ProceduralPedestal/Book
│   ├── museum/                 # re-exports ProceduralMuseumScene
│   └── wormhole/               # re-exports ProceduralWormhole
├── shared/
│   ├── config/appConfig.ts     # centralized player, wormhole and render config
│   ├── config/models.ts        # registry for /models/*.glb paths
│   ├── types/index.ts          # GamePhase, Bounds, ModelRegistry (JSDoc)
│   └── utils/perf.ts           # scratch vectors and easing
└── index.css                   # @import tailwindcss + @theme vars
```

Phase state via `useState<GamePhase>` with interpolated progress through `easeCubicInOut` and `requestAnimationFrame`; book distance via `Math.hypot(pos.x, pos.z)`; rendering via `Canvas` (`shadows`, `dpr [1, 1.8]`, `ACESFilmicToneMapping`) and per-room switchable fog/background. No external store; all side effects (pointer lock, audio) live in dedicated hooks.

---

## Requirements

- Node 18+
- npm 9+

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Zerik-Official/AlegrIA-3D
cd AlegrIA-3D
```

### Dependencies

```bash
npm install
```

---

## Running

### Development (Vite) — recommended with `--host` to test on mobile

```bash
npm run dev
# or with host
npm run dev -- --host
```

Available at `http://localhost:5173` and `http://<your-ip>:5173` for mobile.

### Production preview

```bash
npm run build
npm run preview
```

### Controls

- **WASD** — move, **Shift** — sprint, **Mouse** — look (click to lock)
- **E / Click** when `distance < 2.4m` from the book — trigger vortex
- **ESC** — unlock pointer

---

## Production Build

```bash
npm run build
```

Outputs `dist/` with `base: '/AlegrIA-3D/'` ready for GitHub Pages. The workflow `.github/workflows/deploy.yml` builds on every PR to `main` (`pull_request` + `push` on `main`), copies `dist/index.html` to `dist/404.html` for SPA fallback and publishes with `actions/deploy-pages@v4`.

You can verify the base path locally by inspecting `dist/index.html` — assets should appear as `/AlegrIA-3D/assets/...`.

---

## 3D Models (Blender)

Any mesh can be replaced without touching the scene:

1. Export from Blender: `File > Export > glTF 2.0 (.glb)` with `Apply Modifiers` and `+Y Up`, origin at the object base.
2. Place the `.glb` under `public/models/<domain>/` as defined in `src/shared/config/models.ts`:
   - `library/bookshelf.glb`, `library/scattered-book.glb`
   - `pedestal/pedestal.glb`, `pedestal/book.glb`
   - `museum/pedestal-display.glb`, `museum/column.glb`, `museum/painting-frame.glb`
3. No code changes — `ModelLoader` performs a `fetch HEAD` check and falls back to the procedural mesh if the file is missing.

Folders with explanatory `README.md` are already included in `public/models/` and re-exports in `src/models/<domain>/`.

---

## License

Distributed under the [MIT](LICENSE) license.