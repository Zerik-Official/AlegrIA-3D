/**
 * Shared light-trail effect for flying traffic (cars, trains): a ring-buffer
 * of past positions rendered as fading additive points.
 * @module features/cityIntro/renderers/trail
 */

import { useCallback, useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Ring-buffer of trailing local positions, shifted one slot per frame.
 * @param length - Number of trail samples to keep
 * @returns The backing buffer and a `push` to record the current head position
 */
export function useTrailBuffer(length: number) {
  const positions = useMemo(() => new Float32Array(length * 3), [length])
  const initialized = useRef(false)
  const push = useCallback(
    (x: number, y: number, z: number) => {
      if (!initialized.current) {
        for (let i = 0; i < length; i++) {
          positions[i * 3] = x
          positions[i * 3 + 1] = y
          positions[i * 3 + 2] = z
        }
        initialized.current = true
        return
      }
      for (let i = length - 1; i > 0; i--) {
        positions[i * 3] = positions[(i - 1) * 3]
        positions[i * 3 + 1] = positions[(i - 1) * 3 + 1]
        positions[i * 3 + 2] = positions[(i - 1) * 3 + 2]
      }
      positions[0] = x
      positions[1] = y
      positions[2] = z
    },
    [positions, length]
  )
  return { positions, push }
}

/**
 * Builds the additive, tail-fading point material shared by every light trail.
 * @param color - Trail color
 * @param count - Sample count (matches the trail buffer length)
 * @returns Shader material
 */
export function createTrailMaterial(color: string, count: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uCount: { value: count } },
    vertexShader: `
      attribute float aIndex;
      uniform float uCount;
      varying float vFade;
      void main() {
        vFade = 1.0 - (aIndex / uCount);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (7.0 * vFade + 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vFade;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.0, d) * vFade * 0.85;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  })
}
