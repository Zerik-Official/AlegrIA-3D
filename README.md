# AlegrIA-3D — Time Travel Library

Immersive 3D web experience built with **Vite + React + TypeScript + Three.js**. You spawn inside a library, walk with **WASD + mouse look** toward a levitating book on a pedestal, then get pulled through a **vortex** and wake up inside a **Museum of Time**.

## Stack

- **Vite 8 + React 18 + TypeScript 6** — fast HMR, feature-based architecture
- **Three.js 0.160 + @react-three/fiber 8.15 + @react-three/drei 9.88** — declarative 3D
- **Tailwind CSS 4 + @tailwindcss/vite** — utility HUD (no vanilla CSS except CSS vars)
- **react-icons** — Fi/Lu icons for HUD (no emojis)

## Architecture (feature-based)

```
src/
├── app/App.tsx                 # phase machine: idle -> exploring -> wormhole -> museum
├── features/
│   ├── library/                # LibraryScene + Bookshelf (procedural books, torch lights)
│   ├── pedestal/               # Pedestal + LevitatingBook (hover sin, glow, particles, runes)
│   ├── museum/                 # MuseumScene (marble hall, columns, paintings, vitrines)
│   ├── wormhole/               # Wormhole vortex — NMS hyperjump (rings + star streaks)
│   ├── player/                 # PlayerControls (PointerLock, WASD+shift, bounds, footstep synth)
│   └── ui/                     # HUD, StartOverlay, PastOverlay (Tailwind + react-icons)
├── shared/types
└── index.css                   # @import tailwindcss + @theme vars
```

## Getting Started

```bash
# 1. Install
npm install

# 2. Dev (http://localhost:5173)
npm run dev

# 3. Build
npm run build
npm run preview
```

## Controls

- **WASD** — move, **Shift** — sprint, **Mouse** — look (click to lock)
- **E / Click** when `distance < 2.4m` to the book — trigger vortex
- **ESC** — unlock mouse
- Footsteps synthesized via **Web Audio API** (no external files). Optional CDN samples: Pixabay / Freesound / Mixkit.

## Vortex Detail

NMS-inspired hyperjump: 46 hued torus rings (gold→cyan→purple), 520 star streak points streaming at `progress*3.5` speed, core flash, additive tunnel cylinder + chromatic edge. Camera FOV `74→112` with random shake.

## Roadmap

- Replace procedural shelves/pedestals with GLTF (`useGLTF`)
- Add spatial audio (Howler / `THREE.Audio`) & background ambience
- Add physics colliders (`@react-three/rapier`)
