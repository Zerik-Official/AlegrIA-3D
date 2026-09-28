/**
 * Shared light-trail effect for flying traffic (cars, trains): a ring-buffer
 * of past positions rendered as fading additive points.
 * @module features/cityIntro/renderers/trail
 */

import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Backing buffer for a light trail's `position` attribute.
 * @param length - Number of trail samples to keep
 * @returns Zeroed buffer of `length` XYZ samples
 */
export function useTrailBuffer(length: number): Float32Array {
  return useMemo(() => new Float32Array(length * 3), [length])
}

/**
 * Records the trail's current head position: shifts every sample one slot
 * down the trail, or fills the whole trail on the first call so it doesn't
 * streak in from the origin.
 * @param points - The trail's points object, whose `position` attribute is the ring buffer
 * @param x - Head X, in the trail's local space
 * @param y - Head Y
 * @param z - Head Z
 */
export function pushTrailSample(points: THREE.Points | null, x: number, y: number, z: number): void {
  const attr = points?.geometry.attributes.position as THREE.BufferAttribute | undefined
  if (!points || !attr) return
  const positions = attr.array as Float32Array
  const length = attr.count
  if (!points.userData.trailReady) {
    for (let i = 0; i < length; i++) positions.set([x, y, z], i * 3)
    points.userData.trailReady = true
  } else {
    positions.copyWithin(3, 0, (length - 1) * 3)
    positions[0] = x
    positions[1] = y
    positions[2] = z
  }
  attr.needsUpdate = true
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
