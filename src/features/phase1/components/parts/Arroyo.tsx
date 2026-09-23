import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createSoftCircleTexture } from '@/shared/utils/textures'

/** X span the river, its banks and reeds run across. */
const SPAN_X = 19
/** World Z the river channel is centered on. */
const CHANNEL_Z = -1.1
/** How far below the surrounding barrio ground (y=0) the channel floor sits. */
const CHANNEL_DEPTH = 0.35
/** Half-width of the flat channel floor (and, narrower, the water surface on top of it). */
const CHANNEL_HALF_WIDTH = 0.9
/** How far past the channel floor's edge each sloped bank wall climbs back up to y=0. */
const SLOPE_RUN = 0.5
/** Water surface sits this far above the channel floor — a shallow, walkable-looking creek. */
const WATER_DEPTH_ABOVE_FLOOR = 0.2
/** Water surface half-width, narrower than the floor so a muddy margin shows at each edge. */
const WATER_HALF_WIDTH = 0.72

/**
 * Generates (once) a tapered reed-blade silhouette with a base-to-tip gradient.
 * @returns Canvas-based reed texture
 */
function useReedTexture(): THREE.Texture {
  return useMemo(() => {
    const w = 16
    const h = 96
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(w * 0.5 - 1.4, h)
    ctx.quadraticCurveTo(w * 0.5 - 2.2, h * 0.35, w * 0.5, 0)
    ctx.quadraticCurveTo(w * 0.5 + 2.2, h * 0.35, w * 0.5 + 1.4, h)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, h, 0, 0)
    gradient.addColorStop(0, '#3a4a1e')
    gradient.addColorStop(0.6, '#5c7a2e')
    gradient.addColorStop(1, '#9cbf5a')
    ctx.fillStyle = gradient
    ctx.fill()
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
}

/**
 * Props for {@link BankRocks}.
 */
interface BankRocksProps {
  /** Band center Z. */
  zCenter: number
  /** Band half-width in Z. */
  zJitter: number
  /** Instance count. */
  count: number
  /** Ground level the rocks rest on (differs for the sunken channel floor vs. the bank top). */
  yBase?: number
}

/**
 * Instanced low-poly pebbles/rocks scattered along a Z band, replacing a
 * single blocky bank bar with an irregular, natural-looking edge.
 * @param props - Band placement
 * @returns Instanced rock mesh
 */
function BankRocks({ zCenter, zJitter, count, yBase = 0 }: BankRocksProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.09, 0), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.95 }), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const x = -SPAN_X + Math.random() * SPAN_X * 2
      const z = zCenter + (Math.random() - 0.5) * zJitter
      const y = yBase + 0.02 + Math.random() * 0.05
      dummy.position.set(x, y, z)
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      const s = 0.55 + Math.random() * 1.15
      dummy.scale.set(s, s * 0.7, s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      const tone = 0.35 + Math.random() * 0.35
      color.setRGB(tone * 0.44, tone * 0.4, tone * 0.34)
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [zCenter, zJitter, count, yBase])

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow receiveShadow />
}

/**
 * Props for {@link ReedLine}.
 */
interface ReedLineProps {
  /** Band center Z. */
  zCenter: number
  /** Instance count. */
  count: number
}

/**
 * Instanced crossed-plane reeds hugging just outside the riverbank.
 * @param props - Band placement
 * @returns Instanced reed mesh
 */
function ReedLine({ zCenter, count }: ReedLineProps) {
  const texture = useReedTexture()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.24, 0.85)
    g.translate(0, 0.425, 0)
    return g
  }, [])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }),
    [texture]
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const x = -SPAN_X + Math.random() * SPAN_X * 2
      const z = zCenter + (Math.random() - 0.5) * 0.7
      const s = 0.6 + Math.random() * 0.7
      dummy.position.set(x, 0, z)
      dummy.rotation.set(0, Math.random() * Math.PI, 0)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [zCenter, count])

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow />
}

/**
 * One sloped bank wall connecting the sunken channel floor (at `CHANNEL_DEPTH`
 * below the surrounding ground) back up to bank-top level (y=0), so the
 * river reads as a real depression instead of a flat strip laid over the
 * ground — computed the same way the scene's other flat ground meshes are
 * (`rotation-x=-Math.PI/2` is the zero-slope case of this same formula).
 * @param props - Which side of the channel this slope climbs out on
 * @returns Slope mesh
 */
function BankSlope({ side }: { side: 1 | -1 }) {
  const channelEdgeZ = CHANNEL_Z + side * CHANNEL_HALF_WIDTH
  const bankTopZ = channelEdgeZ + side * SLOPE_RUN
  const dz = bankTopZ - channelEdgeZ
  const dy = 0 - -CHANNEL_DEPTH
  const length = Math.hypot(dz, dy)
  const angle = Math.atan2(dz, dy)
  return (
    <mesh rotation-x={angle} position={[0, -CHANNEL_DEPTH / 2, (channelEdgeZ + bankTopZ) / 2]} receiveShadow>
      <planeGeometry args={[38, length]} />
      {/* Whether this incline's front face ends up up-facing depends on which way it climbs
          (south vs. north), so render both sides rather than solving the winding per-side. */}
      <meshStandardMaterial color="#4a3a22" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  )
}

/**
 * Stylized, noise-textured water — ported from a reference `three-custom-shader-material`
 * demo (see `stylized-water/src/components/Water`) into a plain `THREE.ShaderMaterial`
 * matching this project's convention: an animated simplex-noise pattern doubling as
 * both a wave texture and a foam mask, blended from a near to a far color, plus a
 * gentle whole-surface rise/fall (the reference's "water level" oscillation).
 * @returns Water plane
 */
function StylizedWater() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uColorNear: { value: new THREE.Color('#0fb8c9') },
          uColorFar: { value: new THREE.Color('#1ceeff') },
          uTextureSize: { value: 45 },
          uWaveSpeed: { value: 1.1 },
          uWaveAmplitude: { value: 0.04 },
        },
        vertexShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform float uWaveSpeed;
          uniform float uWaveAmplitude;
          void main() {
            vUv = uv;
            float sineOffset = sin(uTime * uWaveSpeed) * uWaveAmplitude;
            vec3 p = position;
            p.z += sineOffset;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColorNear;
          uniform vec3 uColorFar;
          uniform float uTextureSize;
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

            float vignette = length(vUv - 0.5) * 1.5;
            vec3 baseEffect = smoothstep(0.1, 0.3, vec3(vignette));
            vec3 baseColor = mix(finalColor, uColorFar, baseEffect);

            vec3 combinedEffect = min(waveEffect + foam, 1.0);
            combinedEffect = mix(combinedEffect, vec3(0.0), baseEffect);
            vec3 foamEffect = mix(foam, vec3(0.0), baseEffect);

            finalColor = (1.0 - combinedEffect) * baseColor + combinedEffect;

            vec3 alpha = mix(vec3(0.35), vec3(1.0), foamEffect);
            alpha = mix(alpha, vec3(1.0), vignette + 0.5);

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
    <mesh rotation-x={-Math.PI / 2} position={[0, -CHANNEL_DEPTH + WATER_DEPTH_ABOVE_FLOOR, CHANNEL_Z]} receiveShadow>
      <planeGeometry args={[38, WATER_HALF_WIDTH * 2]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  )
}

/**
 * Stylized river — a sunken channel (sloped banks down to a floor, so the
 * water reads as contained rather than a flat sheet over the whole ground)
 * carrying an animated, noise-textured water surface (see {@link StylizedWater}),
 * with irregular rocky banks and reeds along the rim.
 *
 * @returns Arroyo group
 */
export const Arroyo = memo(function Arroyo() {
  const bankAlphaMap = useMemo(() => createSoftCircleTexture(), [])

  const southEdgeZ = CHANNEL_Z - CHANNEL_HALF_WIDTH
  const northEdgeZ = CHANNEL_Z + CHANNEL_HALF_WIDTH
  const southBankTopZ = southEdgeZ - SLOPE_RUN
  const northBankTopZ = northEdgeZ + SLOPE_RUN

  return (
    <group>
      {/* Sunken channel floor, well below the surrounding ground so the banks visibly contain it. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -CHANNEL_DEPTH, CHANNEL_Z]} receiveShadow>
        <planeGeometry args={[38, CHANNEL_HALF_WIDTH * 2]} />
        <meshStandardMaterial color="#3a4a2e" roughness={1} />
      </mesh>

      <BankSlope side={-1} />
      <BankSlope side={1} />

      {[southBankTopZ - 0.1, southBankTopZ + 0.1, northBankTopZ - 0.1, northBankTopZ + 0.1].map((z, i) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.008, z]} receiveShadow>
          <planeGeometry args={[38, 0.5]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#4a3a22' : '#5a4a2a'} alphaMap={bankAlphaMap} transparent roughness={1} depthWrite={false} />
        </mesh>
      ))}

      <BankRocks zCenter={southBankTopZ} zJitter={0.5} count={44} />
      <BankRocks zCenter={northBankTopZ} zJitter={0.5} count={44} />
      <ReedLine zCenter={southBankTopZ - 0.5} count={38} />
      <ReedLine zCenter={northBankTopZ + 0.5} count={38} />
      <BankRocks zCenter={CHANNEL_Z} zJitter={CHANNEL_HALF_WIDTH * 1.6} count={14} yBase={-CHANNEL_DEPTH} />

      <StylizedWater />
    </group>
  )
})
