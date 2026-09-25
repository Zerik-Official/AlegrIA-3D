/**
 * `culture-mural` — Mural Cultural Digital: la pieza que reemplaza la valla
 * publicitaria genérica de la escena. Una pantalla holográfica montada sobre
 * la pared/estructura lateral que proyecta arte del Carnaval de Barranquilla
 * (marimonda, garabato, tambores) con barrido de escaneo, parpadeo y derrame
 * de color magenta/cian/amarillo solar.
 *
 * El motivo llega en `entity.variant` y el color dominante del derrame en
 * `entity.title` (hex opcional), para que el mural se re-tematice desde JSON
 * sin tocar el shader.
 * @module features/cityIntro/renderers/CultureMuralRenderer
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createMuralTexture } from '@/features/cityIntro/renderers/muralTexture'
import { NEON_CYAN, NEON_MAGENTA, SOLAR_YELLOW } from '@/features/cityIntro/config/colorPalette'
import type { EntityRendererProps } from '@/engine/types'

/** Ancho y alto (unidades de mundo) del panel a `scale: 1`. */
const PANEL_W = 7.2
const PANEL_H = 4.4

const MURAL_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Toma el dibujo de carnaval en escala de intensidad y lo re-colorea entre
 * dos neones según la altura, le suma líneas de escaneo, una banda de glitch
 * que baja en bucle y un parpadeo lento — el conjunto es lo que lo hace leer
 * como proyección holográfica y no como una calcomanía.
 */
const MURAL_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform vec3 uTintA;
  uniform vec3 uTintB;
  uniform vec3 uSpark;
  varying vec2 vUv;

  void main() {
    vec3 art = texture2D(uMap, vUv).rgb;
    float lum = dot(art, vec3(0.299, 0.587, 0.114));

    vec3 tint = mix(uTintA, uTintB, vUv.y);
    vec3 color = art * 0.55 + tint * lum * 1.35;

    float scan = 0.82 + 0.18 * sin((vUv.y + uTime * 0.06) * 620.0);
    color *= scan;

    float band = smoothstep(0.035, 0.0, abs(fract(vUv.y + uTime * 0.11) - 0.5));
    color += uSpark * band * 0.35;

    float flicker = 0.9 + 0.1 * sin(uTime * 7.3) * sin(uTime * 2.1);
    color *= flicker;

    vec2 edge = smoothstep(0.0, 0.06, vUv) * smoothstep(0.0, 0.06, 1.0 - vUv);
    float mask = edge.x * edge.y;

    float alpha = clamp(0.28 + lum * 1.4 + band * 0.3, 0.0, 1.0) * mask;
    gl_FragColor = vec4(color, alpha);
  }
`

/**
 * @param props - Entity props (`variant` = motivo, `title` = hex de derrame)
 * @returns Mural holográfico con su estructura y luz
 */
export function CultureMuralRenderer({ entity }: EntityRendererProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const texture = useMemo(() => createMuralTexture(entity.variant), [entity.variant])
  const spark = entity.title?.startsWith('#') ? entity.title : SOLAR_YELLOW

  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uTime: { value: 0 },
      uTintA: { value: new THREE.Color(NEON_MAGENTA) },
      uTintB: { value: new THREE.Color(NEON_CYAN) },
      uSpark: { value: new THREE.Color(spark) },
    }),
    [texture, spark]
  )

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <group>
      <mesh position={[0, PANEL_H / 2 + 0.6, -0.22]} castShadow receiveShadow>
        <boxGeometry args={[PANEL_W + 0.9, PANEL_H + 1.4, 0.4]} />
        <meshStandardMaterial color="#2a1a2e" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh position={[0, PANEL_H / 2 + 0.6, -0.01]}>
        <boxGeometry args={[PANEL_W + 0.34, PANEL_H + 0.34, 0.08]} />
        <meshStandardMaterial color="#120a18" emissive={NEON_MAGENTA} emissiveIntensity={1.1} roughness={0.4} />
      </mesh>

      <mesh position={[0, PANEL_H / 2 + 0.6, 0.06]}>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={MURAL_VERTEX}
          fragmentShader={MURAL_FRAGMENT}
          transparent
          toneMapped={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight position={[0, PANEL_H / 2 + 0.6, 2.4]} intensity={3.2} distance={16} decay={2} color={NEON_MAGENTA} />
      <pointLight position={[0, 1.2, 1.8]} intensity={1.4} distance={9} decay={2} color={spark} />
    </group>
  )
}
