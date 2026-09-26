/**
 * Hologram shader showing the partners' logos — side by side on a wide
 * screen, or one per screen:
 * each logo materializes in turn behind a sweeping scan beam, over a faint
 * projection grid, with scanlines, flicker and the odd glitch slice. One
 * material, no render targets — cheap enough to leave running.
 * @module features/cityIntro/renderers/PartnerHologramMaterial
 */

import * as THREE from 'three'

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  uniform sampler2D uLogo0;
  uniform sampler2D uLogo1;
  uniform sampler2D uLogo2;
  uniform vec3 uAspects;
  uniform vec3 uKeepColor;
  uniform float uCellAspect;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uCells;
  uniform float uFirstCell;
  uniform float uFlipY;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  vec4 sampleLogo(float cell, vec2 uv) {
    if (cell < 0.5) return texture2D(uLogo0, uv);
    if (cell < 1.5) return texture2D(uLogo1, uv);
    return texture2D(uLogo2, uv);
  }

  void main() {
    vec2 uv = vUv;
    float slice = floor(uv.y * 24.0);
    float glitch = step(0.985, hash(slice + floor(uTime * 9.0))) * (hash(slice * 3.1 + uTime) - 0.5) * 0.06;
    uv.x += glitch;

    float cell = uFirstCell + clamp(floor(uv.x * uCells), 0.0, uCells - 1.0);
    vec2 local = vec2(fract(uv.x * uCells), mix(uv.y, 1.0 - uv.y, uFlipY));
    float aspect = cell < 0.5 ? uAspects.x : (cell < 1.5 ? uAspects.y : uAspects.z);
    float keep = cell < 0.5 ? uKeepColor.x : (cell < 1.5 ? uKeepColor.y : uKeepColor.z);
    vec2 fit = vec2(min(1.0, aspect / uCellAspect), min(1.0, uCellAspect / aspect)) * 0.78;
    vec2 logoUv = (local - 0.5) / fit + 0.5;
    float inside = step(0.0, logoUv.x) * step(logoUv.x, 1.0) * step(0.0, logoUv.y) * step(logoUv.y, 1.0);

    vec3 holo = vec3(0.35, 0.92, 1.0);
    float cycle = mod(uTime * 0.25, 3.0);
    float focus = 1.0 - smoothstep(0.0, 1.0, abs(cycle - cell - 0.5));
    float reveal = smoothstep(0.0, 0.15, fract(uTime * 0.25 + cell * 0.333) - local.y * 0.1);

    vec4 logo = sampleLogo(cell, logoUv) * inside;
    float offsetR = sampleLogo(cell, logoUv + vec2(0.006, 0.0)).a * inside;
    vec3 tint = mix(holo, logo.rgb * 1.3 + 0.15, keep);
    vec3 color = tint * logo.a * (0.75 + focus * 0.6) + vec3(1.0, 0.1, 0.5) * offsetR * 0.25 * (1.0 - logo.a);

    vec2 grid = abs(fract(vec2(vUv.x * 48.0, vUv.y * 8.0)) - 0.5);
    float gridLine = (1.0 - smoothstep(0.0, 0.04, min(grid.x, grid.y))) * 0.12;
    float scan = 0.7 + 0.3 * sin(vUv.y * 220.0 - uTime * 14.0);
    float beam = exp(-pow((vUv.x - fract(uTime * 0.18)) * 18.0, 2.0)) * 0.6;
    float flicker = 0.9 + 0.1 * sin(uTime * 41.0) * sin(uTime * 13.0);
    float edge = smoothstep(0.0, 0.03, vUv.y) * smoothstep(1.0, 0.97, vUv.y);

    vec3 finalColor = (color * reveal + holo * (gridLine + beam * 0.35)) * scan * flicker;
    float alpha = clamp(logo.a * reveal * 0.95 + gridLine + beam * 0.25, 0.0, 1.0) * edge * uOpacity;
    gl_FragColor = vec4(finalColor, alpha);
  }
`

/** Layout options of {@link createPartnerHologramMaterial}. */
export interface PartnerHologramLayout {
  /** How many logos share the screen side by side (3 for all of them, 1 for a single one). */
  cells?: number
  /** Index of the first logo shown. */
  firstCell?: number
  /** Whether to flip the logos vertically — `true` for plain planes, `false` for glTF-UV screens. */
  flipY?: boolean
}

/**
 * @param logos - The three logo textures, left to right
 * @param keepColor - How much of each logo's own color survives the hologram tint, `[0, 1]`
 * @param cellAspect - Width/height of one logo's cell of the screen
 * @param opacity - Overall opacity (lower for a projected layer floating in front)
 * @param layout - Which logos the screen shows, and how its UVs run
 * @returns Additive hologram material; drive `uniforms.uTime` every frame
 */
export function createPartnerHologramMaterial(
  logos: THREE.Texture[],
  keepColor: number[],
  cellAspect: number,
  opacity = 1,
  layout: PartnerHologramLayout = {}
): THREE.ShaderMaterial {
  const { cells = 3, firstCell = 0, flipY = false } = layout
  const aspect = (texture: THREE.Texture | undefined): number => {
    const image = texture?.image as { width?: number; height?: number } | undefined
    return image?.width && image?.height ? image.width / image.height : 1
  }
  return new THREE.ShaderMaterial({
    uniforms: {
      uLogo0: { value: logos[0] },
      uLogo1: { value: logos[1] },
      uLogo2: { value: logos[2] },
      uAspects: { value: new THREE.Vector3(aspect(logos[0]), aspect(logos[1]), aspect(logos[2])) },
      uKeepColor: { value: new THREE.Vector3(keepColor[0] ?? 0, keepColor[1] ?? 0, keepColor[2] ?? 0) },
      uCellAspect: { value: cellAspect },
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uCells: { value: cells },
      uFirstCell: { value: firstCell },
      uFlipY: { value: flipY ? 1 : 0 },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
}

/**
 * Sets the logos up for this shader: glTF-style UVs (planes pass `flipY`
 * in their layout to compensate) and sRGB color. Pass it as `useTexture`'s
 * load callback.
 * @param loaded - Loaded logo textures
 */
export function preparePartnerLogos(loaded: THREE.Texture | THREE.Texture[]): void {
  for (const logo of Array.isArray(loaded) ? loaded : [loaded]) {
    logo.flipY = false
    logo.colorSpace = THREE.SRGBColorSpace
    logo.needsUpdate = true
  }
}
