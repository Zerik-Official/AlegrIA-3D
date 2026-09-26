/**
 * The hover bus parked by the curb, its side screen turned into a hologram
 * of the project's partners' logos, with a second, fainter copy projected
 * a little out from the screen for depth.
 * @module features/cityIntro/renderers/AdBusRenderer
 */

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { PARTNERS } from '@/shared/config/partners'
import { createPartnerHologramMaterial, preparePartnerLogos } from '@/features/cityIntro/renderers/PartnerHologramMaterial'

/** Material the Blender script names the screen with — it gets the hologram. */
const SCREEN_MATERIAL = 'PantallaVideo'
/** Width/height of one logo's third of the bus screen (10.8 × 1.75 overall). */
const SCREEN_CELL_ASPECT = 10.8 / 3 / 1.75
/** How far the projected layer floats out from the screen, along the screen's `+X` side. */
const PROJECTION_OFFSET = 0.45

/**
 * The bus model with the partners' hologram on its screen. The model shows
 * the screen on its local `+X` side; the entity's `rotationY` turns it
 * towards the street.
 * @returns Bus group
 */
function AdBus() {
  const { scene } = useGLTF(modelRegistry['cityIntro/ad-bus'].path) as unknown as { scene: THREE.Group }
  const logos = useTexture(PARTNERS.map((partner) => partner.src), preparePartnerLogos)
  const screenRef = useRef<THREE.Mesh | null>(null)
  const projectionRef = useRef<THREE.Mesh | null>(null)

  const materials = useMemo(() => {
    const keep = PARTNERS.map((partner) => (partner.invert ? 0 : 0.8))
    return {
      screen: createPartnerHologramMaterial(logos, keep, SCREEN_CELL_ASPECT, 1),
      projection: createPartnerHologramMaterial(logos, keep, SCREEN_CELL_ASPECT, 0.32),
    }
  }, [logos])

  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = false
    })
    return c
  }, [scene])

  useEffect(() => {
    let projection: THREE.Mesh | null = null
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material) || mesh.material.name !== SCREEN_MATERIAL) return
      mesh.material = materials.screen
      screenRef.current = mesh
      projection = new THREE.Mesh(mesh.geometry, materials.projection)
      projection.position.copy(mesh.position).x += PROJECTION_OFFSET
      projection.quaternion.copy(mesh.quaternion)
      projection.scale.copy(mesh.scale)
      mesh.parent?.add(projection)
    })
    projectionRef.current = projection
    return () => {
      const added = projectionRef.current
      added?.parent?.remove(added)
      projectionRef.current = null
    }
  }, [cloned, materials])

  useEffect(
    () => () => {
      materials.screen.dispose()
      materials.projection.dispose()
    },
    [materials]
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const screen = screenRef.current
    if (screen) (screen.material as THREE.ShaderMaterial).uniforms.uTime.value = t
    const projection = projectionRef.current
    if (projection) {
      ;(projection.material as THREE.ShaderMaterial).uniforms.uTime.value = t + 0.37
      projection.position.x = (screen?.position.x ?? 0) + PROJECTION_OFFSET + Math.sin(t * 1.4) * 0.05
    }
  })

  return <primitive object={cloned} />
}

/**
 * @returns Renderer element
 */
export function AdBusRenderer() {
  return (
    <Suspense fallback={null}>
      <AdBus />
    </Suspense>
  )
}
