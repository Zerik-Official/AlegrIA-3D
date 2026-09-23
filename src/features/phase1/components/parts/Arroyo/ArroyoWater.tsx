/**
 * Stylized, noise-textured water surface for the arroyo
 * @module features/phase1/components/parts/Arroyo/ArroyoWater
 */

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildLoftGeometry } from '@/features/phase1/components/parts/Arroyo/riverPath'
import { arroyoWaterConfig } from '@/features/phase1/config/arroyoWater'

/** Props for {@link ArroyoWater}. */
interface ArroyoWaterProps {
  /** River centerline the water ribbon follows. */
  curve: THREE.CatmullRomCurve3
  /** Ribbon width. */
  width: number
  /** World Y the water surface sits at. */
  y: number
}

/**
 * @param props - Curve, width and height the water ribbon is built at
 * @returns Water mesh
 */
export function ArroyoWater({ curve, width, y }: ArroyoWaterProps) {
  const geometry = useMemo(
    () => buildLoftGeometry(curve, [{ offset: -width / 2, y }, { offset: width / 2, y }]),
    [curve, width, y]
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColorNear: { value: new THREE.Color(arroyoWaterConfig.colorNear) },
          uColorFar: { value: new THREE.Color(arroyoWaterConfig.colorFar) },
          uTextureSize: { value: arroyoWaterConfig.textureSize },
          uWaveSpeed: { value: arroyoWaterConfig.waveSpeed },
          uWaveAmplitude: { value: arroyoWaterConfig.waveAmplitude },
          uBankFadeStart: { value: arroyoWaterConfig.bankFadeStart },
          uBankFadeEnd: { value: arroyoWaterConfig.bankFadeEnd },
        },
        vertexShader: `
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
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColorNear;
          uniform vec3 uColorFar;
          uniform float uTextureSize;
          uniform float uBankFadeStart;
          uniform float uBankFadeEnd;
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

            float vignette = abs(vUv.y - 0.5) * 2.0;
            vec3 baseEffect = smoothstep(uBankFadeStart, uBankFadeEnd, vec3(vignette));
            vec3 baseColor = mix(finalColor, uColorFar, baseEffect);

            vec3 combinedEffect = min(waveEffect + foam, 1.0);
            combinedEffect = mix(combinedEffect, vec3(0.0), baseEffect);
            vec3 foamEffect = mix(foam, vec3(0.0), baseEffect);

            finalColor = (1.0 - combinedEffect) * baseColor + combinedEffect * vec3(0.75, 0.72, 0.62);

            vec3 alpha = mix(vec3(0.55), vec3(0.92), foamEffect);
            alpha = mix(alpha, vec3(0.92), vignette + 0.5);

            gl_FragColor = vec4(finalColor, alpha.r);
          }
        `,
      }),
    []
  )

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <mesh geometry={geometry} receiveShadow>
      <primitive object={material} attach="material" />
    </mesh>
  )
}
