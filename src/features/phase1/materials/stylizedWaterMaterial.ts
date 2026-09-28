/**
 * Shared animated noise-foam water shader, used by both the arroyo's
 * permanent channel and the periodic street flood.
 * @module features/phase1/materials/stylizedWaterMaterial
 */

import * as THREE from 'three'

/** Uniform-facing parameters for {@link createStylizedWaterMaterial}. */
export interface StylizedWaterParams {
  /** Water color near the fade-out edge. */
  colorNear: string
  /** Water color away from the fade-out edge. */
  colorFar: string
  /** Foam/wave noise scale (0-100, higher = finer texture). */
  textureSize: number
  /** Surface bob speed. */
  waveSpeed: number
  /** Surface bob height. */
  waveAmplitude: number
  /** Fraction of the edge distance (0-1) where the foam/wave pattern starts fading out. */
  edgeFadeStart: number
  /** Fraction of the edge distance (0-1) where the foam/wave pattern is fully faded out. */
  edgeFadeEnd: number
  /**
   * Which UV axes the edge-distance measures — `[0, 1]` fades only across V
   * (e.g. a channel's banks), `[1, 1]` fades radially from the UV center
   * (e.g. an open flooded area).
   */
  edgeAxis: [number, number]
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uWaveAmplitude;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.y += sin(uTime * uWaveSpeed) * uWaveAmplitude;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColorNear;
  uniform vec3 uColorFar;
  uniform float uTextureSize;
  uniform float uEdgeFadeStart;
  uniform float uEdgeFadeEnd;
  uniform vec2 uEdgeAxis;
  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec3 finalColor = uColorNear;
    float textureSize = 100.0 - uTextureSize;

    float noiseBase = snoise(vUv * (textureSize * 2.8) + sin(uTime * 0.3));
    noiseBase = noiseBase * 0.5 + 0.5;
    vec3 foam = step(0.5, smoothstep(0.08, 0.001, vec3(noiseBase)));

    float noiseWaves = snoise(vUv * textureSize + sin(uTime * -0.1));
    noiseWaves = noiseWaves * 0.5 + 0.5;
    float threshold = 0.6 + 0.01 * sin(uTime * 2.0);
    vec3 waveEffect = 1.0 - (smoothstep(threshold + 0.03, threshold + 0.032, vec3(noiseWaves))
      + smoothstep(threshold, threshold - 0.01, vec3(noiseWaves)));
    waveEffect = step(0.5, waveEffect);

    float edgeDist = length((vUv - 0.5) * uEdgeAxis) * 2.0;
    vec3 edgeEffect = smoothstep(uEdgeFadeStart, uEdgeFadeEnd, vec3(edgeDist));
    vec3 baseColor = mix(finalColor, uColorFar, edgeEffect);

    vec3 combinedEffect = min(waveEffect + foam, 1.0);
    combinedEffect = mix(combinedEffect, vec3(0.0), edgeEffect);
    vec3 foamEffect = mix(foam, vec3(0.0), edgeEffect);

    finalColor = (1.0 - combinedEffect) * baseColor + combinedEffect * vec3(0.75, 0.72, 0.62);

    vec3 alpha = mix(vec3(0.55), vec3(0.92), foamEffect);
    alpha = mix(alpha, vec3(0.92), edgeDist + 0.5);

    gl_FragColor = vec4(finalColor, alpha.r);
  }
`

/**
 * `depthWrite: false` avoids z-fighting flicker against the bank mesh, which
 * sits only ~0.02 units below the water surface and gets pushed through it
 * every frame by the vertex shader's wave bob — a transparent depth-writing
 * surface racing an opaque one at nearly the same depth pops in/out as the
 * camera moves.
 * @param params - Color, noise and edge-fade tuning
 * @returns Shader material with `uTime` left at `0`, to be driven by the caller
 */
export function createStylizedWaterMaterial(params: StylizedWaterParams): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColorNear: { value: new THREE.Color(params.colorNear) },
      uColorFar: { value: new THREE.Color(params.colorFar) },
      uTextureSize: { value: params.textureSize },
      uWaveSpeed: { value: params.waveSpeed },
      uWaveAmplitude: { value: params.waveAmplitude },
      uEdgeFadeStart: { value: params.edgeFadeStart },
      uEdgeFadeEnd: { value: params.edgeFadeEnd },
      uEdgeAxis: { value: new THREE.Vector2(...params.edgeAxis) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  })
}
