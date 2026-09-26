import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { beatAt, CARNIVAL_HOLOGRAMS, CARNIVAL_NEON, type CarnivalHologram } from '@/features/cityIntro/config/carnivalLayout'
import { canvasTexture, neonText } from '@/features/cityIntro/components/carnival/neonCanvas'
import { createSeededRandom } from '@/shared/utils/random'

/** Deterministic random source for this module's procedural layout, so render stays pure. */
const seededRandom = createSeededRandom(4416)

/** Hologram panel size. */
const PANEL: [number, number] = [4.4, 2.2]
/** Height the panels hang at — above the pennant strings. */
const HANG_Y = 6.7
/** How far off the avenue's center line each panel hangs. */
const OFFSET_X = 3.4

/** The artworks the holograms project, drawn on a transparent canvas. */
const HOLOGRAM_ART: Array<(ctx: CanvasRenderingContext2D, w: number, h: number) => void> = [
  (c, w, h) => {
    neonText(c, 'BAILA', w / 2, h * 0.3, 170, '#FF007F')
    neonText(c, 'LA CALLE', w / 2, h * 0.58, 120, '#FFD60A')
    neonText(c, '2050', w / 2, h * 0.83, 90, '#2E9BFF')
  },
  (c, w, h) => {
    c.lineWidth = 14
    c.shadowBlur = 30
    c.strokeStyle = c.shadowColor = '#FFB703'
    c.beginPath()
    c.arc(w * 0.28, h / 2, h * 0.28, 0, Math.PI * 2)
    c.stroke()
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2
      c.beginPath()
      c.moveTo(w * 0.28 + Math.cos(a) * h * 0.34, h / 2 + Math.sin(a) * h * 0.34)
      c.lineTo(w * 0.28 + Math.cos(a) * h * 0.44, h / 2 + Math.sin(a) * h * 0.44)
      c.stroke()
    }
    neonText(c, 'CARNAVAL', w * 0.68, h * 0.42, 110, '#39FF88')
    neonText(c, 'DEL FUTURO', w * 0.68, h * 0.66, 70, '#FF007F')
  },
  (c, w, h) => {
    neonText(c, '¡QUE', w / 2, h * 0.3, 130, '#39FF88')
    neonText(c, 'VIVA LA', w / 2, h * 0.55, 110, '#FF7A00')
    neonText(c, 'FIESTA!', w / 2, h * 0.8, 130, '#FF007F')
  },
  (c, w, h) => {
    c.lineWidth = 12
    const waves = ['#FF007F', '#FFD60A', '#2E9BFF', '#39FF88']
    waves.forEach((col, k) => {
      c.strokeStyle = c.shadowColor = col
      c.shadowBlur = 26
      c.beginPath()
      for (let x = 0; x <= w; x += 8) c.lineTo(x, h * 0.3 + k * h * 0.14 + Math.sin(x * 0.02 + k) * 26)
      c.stroke()
    })
    neonText(c, 'BAILA LA CALLE', w / 2, h * 0.88, 80, '#fff')
  },
]

/**
 * @param map - Artwork texture
 * @param tint - Frame tint mixed faintly into the projection
 * @returns Additive hologram material: scanlines, a glitch band, flicker, soft edges and a pulse on the beat
 */
function createHologramMaterial(map: THREE.Texture, tint: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
    uniforms: { map: { value: map }, t: { value: 0 }, pulse: { value: 0 }, tint: { value: new THREE.Color(tint) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D map; uniform float t, pulse; uniform vec3 tint; varying vec2 vUv;
      float h(float n){ return fract(sin(n) * 43758.5); }
      void main(){
        vec2 uv = vUv;
        float band = step(0.985, h(floor(t * 8.0))) * 0.02;
        uv.x += band * sin(uv.y * 80.0);
        vec4 c = texture2D(map, uv);
        float scan = 0.72 + 0.28 * sin(uv.y * 420.0 - t * 6.0);
        float flick = 0.88 + 0.12 * step(0.08, h(floor(t * 20.0)));
        float edge = smoothstep(0.0, 0.02, uv.x) * smoothstep(1.0, 0.98, uv.x) * smoothstep(0.0, 0.03, uv.y) * smoothstep(1.0, 0.97, uv.y);
        vec3 col = c.rgb * scan * flick * (1.4 + pulse * 0.6) + tint * 0.05 * scan;
        gl_FragColor = vec4(col * edge, (c.a * 0.9 + 0.08) * edge);
      }
    `,
  })
}

/**
 * One suspended hologram: the projected artwork in a glowing frame, a small
 * projector under it and two cables up to the sky, bobbing gently.
 * @param props - Placement and artwork
 * @returns Hologram group
 */
const Hologram = memo(function Hologram({ z, side, art }: CarnivalHologram) {
  const groupRef = useRef<THREE.Group>(null)
  const panelRef = useRef<THREE.Mesh>(null)
  const phase = useMemo(() => seededRandom() * 6, [])
  const tint = useMemo(() => CARNIVAL_NEON[Math.floor(seededRandom() * CARNIVAL_NEON.length)], [])
  const material = useMemo(() => {
    const texture = canvasTexture(1024, 512, (c, w, h) => {
      c.clearRect(0, 0, w, h)
      HOLOGRAM_ART[art % HOLOGRAM_ART.length](c, w, h)
    })
    return createHologramMaterial(texture, tint)
  }, [art, tint])
  const cables = useMemo(
    () =>
      [-2, 2].map(
        (x) =>
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, PANEL[1] / 2, 0), new THREE.Vector3(x * 1.2, 4, 0)]),
            new THREE.LineBasicMaterial({ color: '#1a1a22' })
          )
      ),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const panel = panelRef.current
    if (panel) {
      const uniforms = (panel.material as THREE.ShaderMaterial).uniforms
      uniforms.t.value = t + phase
      uniforms.pulse.value = beatAt(t).kick
    }
    if (groupRef.current) groupRef.current.position.y = HANG_Y + Math.sin(t * 0.8 + phase) * 0.06
  })

  const [w, h] = PANEL
  return (
    <group ref={groupRef} position={[side * OFFSET_X, HANG_Y, z]} rotation-y={-side * 0.75}>
      <mesh ref={panelRef} material={material}>
        <planeGeometry args={PANEL} />
      </mesh>
      {[
        [w + 0.1, 0.05, 0, h / 2 + 0.03],
        [w + 0.1, 0.05, 0, -h / 2 - 0.03],
        [0.05, h + 0.1, -w / 2 - 0.03, 0],
        [0.05, h + 0.1, w / 2 + 0.03, 0],
      ].map(([bw, bh, x, y], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <boxGeometry args={[bw, bh, 0.05]} />
          <meshBasicMaterial color={tint} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, -h / 2 - 0.25, 0.1]}>
        <boxGeometry args={[0.5, 0.14, 0.3]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
      </mesh>
      {cables.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  )
})

/**
 * The holograms hanging over the avenue, alternating sides, projecting the
 * party's slogans and carnival art.
 * @returns Holograms group
 */
export const CarnivalHolograms = memo(function CarnivalHolograms() {
  return (
    <group>
      {CARNIVAL_HOLOGRAMS.map((holo) => (
        <Hologram key={holo.z} {...holo} />
      ))}
    </group>
  )
})
