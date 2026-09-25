import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { beatAt, CARNIVAL_STALLS, STALL_SIZE, type CarnivalStall } from '@/features/cityIntro/config/carnivalLayout'
import { canvasTexture, neonText } from '@/features/cityIntro/components/carnival/neonCanvas'

/** Shared materials for the stalls' structure. */
const mats = {
  counter: new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: 0.7 }),
  pole: new THREE.MeshStandardMaterial({ color: '#2b2b33', metalness: 0.7, roughness: 0.3 }),
}

/**
 * One food stall: a wooden counter with an LED edge, a striped awning in
 * its color, and a neon sign facing the avenue that flickers now and then
 * and brightens on the beat.
 * @param props - Stall
 * @returns Stall group
 */
const Stall = memo(function Stall({ text, color, position, side }: CarnivalStall) {
  const signRef = useRef<THREE.MeshBasicMaterial>(null)
  const [width, length] = STALL_SIZE
  const awning = useMemo(
    () =>
      canvasTexture(256, 64, (c, w, h) => {
        for (let k = 0; k < 8; k++) {
          c.fillStyle = k % 2 ? '#f3efe6' : color
          c.fillRect((k * w) / 8, 0, w / 8, h)
        }
      }),
    [color]
  )
  const sign = useMemo(
    () =>
      canvasTexture(1024, 256, (c, w, h) => {
        c.fillStyle = '#07040b'
        c.fillRect(0, 0, w, h)
        neonText(c, text, w / 2, h / 2, 120, color)
      }),
    [text, color]
  )
  const led = useMemo(() => new THREE.Color(color).multiplyScalar(2.2), [color])

  useFrame(({ clock }) => {
    if (!signRef.current) return
    const brightness = Math.random() < 0.01 ? 0.5 : 1.5 + beatAt(clock.elapsedTime).kick * 0.3
    signRef.current.color.setScalar(brightness)
  })

  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.68, 0]} material={mats.counter} castShadow>
        <boxGeometry args={[width - 0.1, 1.0, length - 0.1]} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[width, 0.04, length]} />
        <meshBasicMaterial color={led} toneMapped={false} />
      </mesh>
      {[-1, 1].flatMap((sz) =>
        [-1, 1].map((sx) => (
          <mesh key={`${sx}:${sz}`} position={[sx * 0.5, 1.2, sz * (length / 2 - 0.1)]} material={mats.pole}>
            <boxGeometry args={[0.05, 2.4, 0.05]} />
          </mesh>
        ))
      )}
      <mesh position={[0, 2.45, 0]} rotation={[-Math.PI / 2 + side * -0.28, Math.PI / 2, 0, 'YXZ']}>
        <planeGeometry args={[length + 0.2, 1.4]} />
        <meshStandardMaterial map={awning} side={THREE.DoubleSide} roughness={0.8} emissive={color} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[-side * 0.02, 2.95, 0]} rotation-y={-side * (Math.PI / 2)}>
        <planeGeometry args={[length - 0.1, 0.7]} />
        <meshBasicMaterial ref={signRef} map={sign} toneMapped={false} />
      </mesh>
      <pointLight position={[-side * 0.8, 2, 0]} color={color} intensity={3} distance={5} decay={2} />
    </group>
  )
})

/**
 * The street party's food stalls along the sidewalks.
 * @returns Stalls group
 */
export const CarnivalStalls = memo(function CarnivalStalls() {
  return (
    <group>
      {CARNIVAL_STALLS.map((stall) => (
        <Stall key={stall.text + stall.position.join(':')} {...stall} />
      ))}
    </group>
  )
})
