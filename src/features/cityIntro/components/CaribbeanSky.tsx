/**
 * Cielo de atardecer caribeño neón para `cityIntro`. Reemplaza la noche negra
 * de la versión cyberpunk: degradado púrpura → magenta → naranja → amarillo
 * solar en el horizonte, con un sol bajo y un banco de nubes teñidas.
 *
 * Es una esfera invertida con shader propio en vez de un `Environment` HDRI
 * porque el degradado es parte de la identidad de la fase (viene de la paleta
 * abajera) y así no hay que versionar un `.hdr` de varios MB.
 * @module features/cityIntro/components/CaribbeanSky
 */

import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DUSK_PURPLE, NEON_MAGENTA, SOLAR_YELLOW, SUNSET_ORANGE } from '@/features/cityIntro/config/colorPalette'

const SKY_RADIUS = 258

/** Sun direction used when the scene has no `sun` entity. */
const DEFAULT_SUN_POSITION: [number, number, number] = [-0.42, 0.1, -1]

const SKY_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vDir;

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;

    vec3 color = mix(uHorizon, uMid, smoothstep(0.03, 0.30, h));
    color = mix(color, uZenith, smoothstep(0.26, 0.80, h));
    color = mix(uGround, color, smoothstep(-0.09, 0.11, h));

    float sun = max(dot(dir, normalize(uSunDir)), 0.0);
    color += uGround * pow(sun, 30.0) * 1.6;
    color += uHorizon * pow(sun, 6.0) * 0.4;

    float band = sin(h * 46.0 - uTime * 0.045) * sin(dir.x * 5.0 + uTime * 0.03);
    color += vec3(0.05, 0.015, 0.05) * band * smoothstep(0.0, 0.3, h) * (1.0 - smoothstep(0.35, 0.7, h));

    gl_FragColor = vec4(color, 1.0);
  }
`

/**
 * Props for {@link CaribbeanSky}.
 */
interface CaribbeanSkyProps {
  /** World position of the scene's `sun` entity; the dome paints the sun's glow in that direction. */
  sunPosition?: [number, number, number]
}

/**
 * @param props - Sun placement
 * @returns Sky dome and its magenta fill light; the sun's own light comes from the `sun` entity
 */
export const CaribbeanSky = memo(function CaribbeanSky({ sunPosition = DEFAULT_SUN_POSITION }: CaribbeanSkyProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uZenith: { value: new THREE.Color(DUSK_PURPLE) },
      uMid: { value: new THREE.Color(NEON_MAGENTA).lerp(new THREE.Color(DUSK_PURPLE), 0.42) },
      uHorizon: { value: new THREE.Color(SUNSET_ORANGE).lerp(new THREE.Color(SOLAR_YELLOW), 0.35) },
      uGround: { value: new THREE.Color(SOLAR_YELLOW).lerp(new THREE.Color('#ffffff'), 0.25) },
      uSunDir: { value: new THREE.Vector3(...DEFAULT_SUN_POSITION).normalize() },
      uTime: { value: 0 },
    }),
    []
  )

  const [sunX, sunY, sunZ] = sunPosition
  useEffect(() => {
    uniforms.uSunDir.value.set(sunX, sunY, sunZ).normalize()
  }, [uniforms, sunX, sunY, sunZ])

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <group userData={{ editorIgnore: true }}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[SKY_RADIUS, 32, 24]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={SKY_VERTEX}
          fragmentShader={SKY_FRAGMENT}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <directionalLight position={[40, 30, 60]} intensity={0.35} color={NEON_MAGENTA} castShadow={false} />
    </group>
  )
})
