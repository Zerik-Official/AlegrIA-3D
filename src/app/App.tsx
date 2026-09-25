import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { appConfig } from '@/shared/config/appConfig'
import { useExperience } from '@/app/hooks/useExperience'
import { SceneStage } from '@/app/components/SceneStage'
import { PlayerRig } from '@/app/components/PlayerRig'
import { EditorRig } from '@/app/components/EditorRig'
import { GameHUD } from '@/app/components/hud/GameHUD'

/**
 * Root of the experience. All state — the phase machine, narration and the
 * story beats that hang off it, proximity, editor and photo modal — is
 * composed by {@link useExperience}; this component only lays out the canvas
 * (the scene via {@link SceneStage}, the player's controls via
 * {@link PlayerRig}, the editor's tools via {@link EditorRig}) and the DOM
 * overlays via {@link GameHUD}.
 *
 * @returns Application element
 */
export default function App() {
  const experience = useExperience()

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#06040a', position: 'relative' }}>
      <Canvas
        shadows
        dpr={appConfig.render.dpr}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        camera={{ fov: 72, near: 0.1, far: 280, position: [0, appConfig.player.eyeHeight, 9] }}
        style={{ width: '100%', height: '100%' }}
      >
        <SceneStage experience={experience} />
        <PlayerRig experience={experience} />
        <EditorRig experience={experience} />
      </Canvas>
      <GameHUD experience={experience} />
    </div>
  )
}
