import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { ProceduralTrinitaria, ProceduralTree } from '@/shared/components/ReusableModels'
import { PhaseEngine } from '@/engine/PhaseEngine'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Colorful facade with trinitaria balcony.
 */
function ColorfulFacade({
  position,
  color,
  rotationY = 0,
}: {
  position: [number, number, number]
  color: string
  rotationY?: number
}) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.2, 1.9]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.32, 0.98]}>
        <boxGeometry args={[3.0, 0.18, 0.22]} />
        <meshStandardMaterial color="#2e1f14" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.82, 0.98]}>
        <boxGeometry args={[3.0, 0.14, 0.22]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.05, 0.99]}>
        <planeGeometry args={[2.2, 1.05]} />
        <meshStandardMaterial color="#1a1208" roughness={1} />
      </mesh>
      <mesh position={[-0.72, 1.02, 1.02]}>
        <planeGeometry args={[0.42, 0.72]} />
        <meshStandardMaterial color="#7ab8ff" transparent opacity={0.22} roughness={0.32} />
      </mesh>
      <mesh position={[0.72, 1.02, 1.02]}>
        <planeGeometry args={[0.42, 0.72]} />
        <meshStandardMaterial color="#7ab8ff" transparent opacity={0.22} roughness={0.32} />
      </mesh>
    </group>
  )
}

/**
 * Gothic temple silhouette with illuminated windows.
 */
function GothicTemple({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!glowRef.current) return
    const mat = glowRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.42 + Math.sin(clock.elapsedTime * 0.9) * 0.12
  })
  return (
    <group position={position}>
      <mesh position={[0, 1.65, 0]} castShadow>
        <boxGeometry args={[4.2, 3.3, 2.0]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.98} />
      </mesh>
      <mesh position={[0, 3.45, 0]} castShadow>
        <coneGeometry args={[2.3, 1.8, 4]} />
        <meshStandardMaterial color="#0f0f12" roughness={0.98} />
      </mesh>
      <mesh ref={glowRef} position={[0, 1.35, 1.02]}>
        <planeGeometry args={[1.45, 1.85]} />
        <meshStandardMaterial color="#0a0f1e" emissive="#ff8a1a" emissiveIntensity={0.42} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 1.35, 1.03]}>
        <planeGeometry args={[1.45, 1.85]} />
        <meshStandardMaterial color="#ffcc66" wireframe transparent opacity={0.08} />
      </mesh>
      <pointLight position={[0, 1.55, 1.4]} intensity={2.2} distance={7} color="#ffb84a" decay={2} />
    </group>
  )
}

/**
 * Props for {@link Phase2Scene}.
 */
interface Phase2SceneProps {
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

/**
 * Phase 2 scene — Época Dorada, Tradición y Carnaval (1919–1950s).
 * Fachadas coloridas, trinitarias, templo gótico y ambiente festivo.
 * All meshes swappable via registry (`phase2/*`).
 *
 * @param props - Scene props
 * @returns Phase 2 group
 */
export const Phase2Scene = memo(function Phase2Scene({ editableEntities }: Phase2SceneProps) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#bfa86a" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color="#c9b896" roughness={0.96} />
      </mesh>

      {editableEntities ? (
        <PhaseEngine entities={editableEntities} />
      ) : (
        <>
          <ModelLoader
            src={modelRegistry['phase2/facade'].path}
            fallback={
              <group>
                <ColorfulFacade position={[-6.2, 0, -4.8]} color="#e85a3a" rotationY={0.18} />
                <ColorfulFacade position={[-2.2, 0, -5.2]} color="#f2c94c" rotationY={-0.08} />
                <ColorfulFacade position={[2.4, 0, -4.6]} color="#6b8e4e" rotationY={0.12} />
                <ColorfulFacade position={[6.4, 0, -3.8]} color="#4a6fa5" rotationY={-0.22} />
                <ColorfulFacade position={[-5.8, 0, 2.2]} color="#d86a7a" rotationY={0.32} />
                <ColorfulFacade position={[5.8, 0, 2.8]} color="#f2a94c" rotationY={-0.28} />
              </group>
            }
          />

          <ModelLoader src={modelRegistry['phase2/temple'].path} fallback={<GothicTemple position={[0, 0, -9.2]} />} />

          <ProceduralTrinitaria position={[-5.8, 0.42, -3.8]} bloomColor="#d82a7a" scale={1.15} />
          <ProceduralTrinitaria position={[-1.9, 0.42, -4.2]} bloomColor="#a52ad8" scale={1.05} />
          <ProceduralTrinitaria position={[2.8, 0.42, -3.6]} bloomColor="#ff6a1a" scale={1.12} />
          <ProceduralTrinitaria position={[6.6, 0.42, -2.8]} bloomColor="#d82a7a" scale={0.98} />
          <ProceduralTrinitaria position={[-4.8, 0.42, 2.2]} bloomColor="#7a2ad8" scale={1.08} />
          <ProceduralTrinitaria position={[5.2, 0.42, 3.0]} bloomColor="#d82a3a" scale={1.02} />

          <ProceduralTree position={[-7.8, 0, -1.2]} scale={1.2} foliageColor="#2a5a1e" />
          <ProceduralTree position={[7.2, 0, -0.8]} scale={1.15} foliageColor="#1e4a14" />
          <ProceduralTree position={[-3.2, 0, 5.2]} scale={0.92} foliageColor="#3a6a1e" />
        </>
      )}

      <ambientLight intensity={0.72} color="#ffe9c4" />
      <hemisphereLight args={['#ffecd0', '#bfa86a', 0.52]} />
      <directionalLight position={[8, 12, 4]} intensity={1.45} color="#fff4d0" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 3.2, -9.2]} intensity={1.8} distance={12} color="#ff8a1a" decay={2} />
    </group>
  )
})
