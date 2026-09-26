/**
 * The finale's ride: a hovering "Barrio Abajo Tour" mototaxi gliding along
 * the city's `path-point` route to the concert by RIWI's headquarters, with
 * the player aboard. The player can only look around — from the passenger
 * bench, or from a chase camera where they appear as a hologram — and gets
 * off (`E`) once it has arrived, after which it stays parked there.
 * @module features/cityIntro/components/mototaxi/MototaxiRide
 */

import { memo, Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import { appConfig, playerConfig } from '@/shared/config/appConfig'
import { useVideoPlaylistTexture } from '@/shared/hooks/useVideoPlaylistTexture'
import { GroundGlow } from '@/shared/components/LightGlows'
import { HologramPassenger } from '@/features/cityIntro/components/mototaxi/HologramPassenger'
import { mototaxiState } from '@/features/cityIntro/state/mototaxiState'
import type { RideView } from '@/app/hooks/useCityFinale'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link MototaxiRide}.
 */
interface MototaxiRideProps {
  /** `path-point` entities of the route, ordered by their `variant` index. */
  pathEntities: EditableEntity[]
  /** Cruising speed, in units per second. */
  speed: number
  /** Whether the player is aboard; once `false` the mototaxi stays parked where it stopped. */
  riding: boolean
  /** Ride camera. */
  view: RideView
  /** Reports the ride's arc-length progress, `[0, 1]`. */
  onProgress: (progress: number) => void
}

/** Video playing on the dashboard screen, muted and looping. */
const SCREEN_VIDEO = [`${import.meta.env.BASE_URL}videos/future/barrio-abajo-tour.mp4`]
/** Material name of the dashboard screen in `moto-taxy.py`. */
const SCREEN_MATERIAL = 'PantallaNKD'
/** Hover height of the mototaxi's frame above the street. */
const HOVER_Y = 0.35
/** Passenger's eye on the bench, in the mototaxi's local space (forward is `+X`). */
const SEAT_EYE = new THREE.Vector3(-0.72, 1.72, 0)
/** Bench surface, where the hologram passenger sits. */
const SEAT_SURFACE: [number, number, number] = [-0.8, 1.0, 0]
/** Chase camera's distance behind and height above the mototaxi. */
const CHASE_DISTANCE = 5.6
const CHASE_HEIGHT = 2.6
/** Mouse-look sensitivity, in radians per pixel. */
const LOOK_SPEED = 0.0022
/** How far the passenger can turn their head from straight ahead. */
const MAX_YAW = Math.PI * 0.85
const MAX_PITCH = Math.PI * 0.35
/** How quickly the chase camera catches up. */
const CHASE_DAMPING = 4

/** Reused scratch objects. */
const scratch = {
  point: new THREE.Vector3(),
  tangent: new THREE.Vector3(),
  eye: new THREE.Vector3(),
  target: new THREE.Vector3(),
  euler: new THREE.Euler(0, 0, 0, 'YXZ'),
}

/**
 * The mototaxi model with the tour video on its dashboard screen — until it
 * arrives at the concert, where the video moves onto the stage's wall and
 * the dashboard goes dark.
 * @returns Model
 */
function MototaxiModel() {
  const { scene } = useGLTF(modelRegistry['cityIntro/mototaxi'].path) as unknown as { scene: THREE.Group }
  const texture = useVideoPlaylistTexture(SCREEN_VIDEO, false)
  const screenMaterial = useMemo(() => (texture ? new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }) : null), [texture])

  const model = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return c
  }, [scene])

  const screenRef = useRef<{ mesh: THREE.Mesh; blank: THREE.Material } | null>(null)

  useEffect(() => {
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material)) return
      if (mesh.material.name === SCREEN_MATERIAL) screenRef.current ??= { mesh, blank: mesh.material }
    })
  }, [model])

  useFrame(() => {
    const screen = screenRef.current
    if (!screen) return
    const wanted = !mototaxiState.arrived && screenMaterial ? screenMaterial : screen.blank
    if (screen.mesh.material !== wanted) screen.mesh.material = wanted
  })

  useEffect(() => () => screenMaterial?.dispose(), [screenMaterial])

  return <primitive object={model} />
}

/**
 * Shown while the model loads, or when it's missing.
 * @returns Placeholder body
 */
function MototaxiFallback() {
  return (
    <mesh position={[0.3, 1.1, 0]} castShadow>
      <boxGeometry args={[3.2, 1.6, 1.6]} />
      <meshStandardMaterial color="#ffcc33" roughness={0.6} />
    </mesh>
  )
}

/**
 * @param props - Route, speed, riding state, camera and progress callback
 * @returns Mototaxi group
 */
export const MototaxiRide = memo(function MototaxiRide({ pathEntities, speed, riding, view, onProgress }: MototaxiRideProps) {
  const { gl } = useThree()
  const vehicleRef = useRef<THREE.Group>(null)
  const traveled = useRef(0)
  const look = useRef({ yaw: 0, pitch: 0 })
  const placed = useRef(false)
  const wasRiding = useRef(riding)

  const curve = useMemo(() => {
    const sorted = [...pathEntities].sort((a, b) => (parseFloat(a.variant ?? '0') || 0) - (parseFloat(b.variant ?? '0') || 0))
    if (sorted.length < 2) return null
    return new THREE.CatmullRomCurve3(
      sorted.map((e) => new THREE.Vector3(e.position[0], 0, e.position[2])),
      false,
      'catmullrom',
      0.3
    )
  }, [pathEntities])

  useEffect(() => {
    if (!riding) return
    const dom = gl.domElement
    const onClick = (): void => {
      if (!document.pointerLockElement) dom.requestPointerLock?.()
    }
    const onMove = (event: MouseEvent): void => {
      if (!document.pointerLockElement) return
      const l = look.current
      l.yaw = THREE.MathUtils.clamp(l.yaw - event.movementX * LOOK_SPEED, -MAX_YAW, MAX_YAW)
      l.pitch = THREE.MathUtils.clamp(l.pitch - event.movementY * LOOK_SPEED, -MAX_PITCH, MAX_PITCH)
    }
    dom.addEventListener('click', onClick)
    document.addEventListener('mousemove', onMove)
    return () => {
      dom.removeEventListener('click', onClick)
      document.removeEventListener('mousemove', onMove)
    }
  }, [riding, gl])

  useEffect(
    () => () => {
      mototaxiState.active = false
      mototaxiState.arrived = false
    },
    []
  )

  useFrame(({ camera, clock }, delta) => {
    const vehicle = vehicleRef.current
    if (!vehicle || !curve) return
    const length = curve.getLength()
    const dt = Math.min(delta, 0.05)

    if (riding && traveled.current < length) {
      traveled.current = Math.min(length, traveled.current + speed * dt)
      onProgress(traveled.current / length)
    }
    const u = length > 0 ? traveled.current / length : 0
    curve.getPointAt(u, scratch.point)
    curve.getTangentAt(Math.min(u, 0.999), scratch.tangent)
    const heading = Math.atan2(-scratch.tangent.z, scratch.tangent.x)
    const t = clock.elapsedTime
    vehicle.position.set(scratch.point.x, HOVER_Y + Math.sin(t * 1.6) * 0.04, scratch.point.z)
    vehicle.rotation.set(Math.sin(t * 1.1) * 0.012, heading, Math.sin(t * 1.3) * 0.015)
    vehicle.updateMatrixWorld()

    mototaxiState.position.copy(vehicle.position)
    mototaxiState.active = riding
    mototaxiState.arrived = u >= appConfig.cityIntro.arrivalThreshold

    if (wasRiding.current && !riding) {
      const side = new THREE.Vector3(0, 0, -1.9).applyAxisAngle(THREE.Object3D.DEFAULT_UP, heading)
      camera.position.set(vehicle.position.x + side.x, playerConfig.eyeHeight, vehicle.position.z + side.z)
      scratch.euler.set(0, heading - Math.PI / 2, 0)
      camera.quaternion.setFromEuler(scratch.euler)
    }
    wasRiding.current = riding
    if (!riding) return

    const l = look.current
    if (view === 'first') {
      scratch.eye.copy(SEAT_EYE)
      vehicle.localToWorld(scratch.eye)
      camera.position.copy(scratch.eye)
      scratch.euler.set(l.pitch, heading - Math.PI / 2 + l.yaw, 0)
      camera.quaternion.setFromEuler(scratch.euler)
      placed.current = false
      return
    }

    const orbit = heading + Math.PI + l.yaw
    scratch.eye.set(
      vehicle.position.x + Math.cos(orbit) * CHASE_DISTANCE,
      vehicle.position.y + CHASE_HEIGHT - l.pitch * 2.2,
      vehicle.position.z - Math.sin(orbit) * CHASE_DISTANCE
    )
    if (placed.current) camera.position.lerp(scratch.eye, 1 - Math.exp(-CHASE_DAMPING * dt))
    else camera.position.copy(scratch.eye)
    placed.current = true
    scratch.target.set(vehicle.position.x, vehicle.position.y + 1.2, vehicle.position.z)
    camera.lookAt(scratch.target)
  })

  return (
    <group ref={vehicleRef}>
      <Suspense fallback={<MototaxiFallback />}>
        <MototaxiModel />
      </Suspense>
      <HologramPassenger visible={riding && view === 'third'} position={SEAT_SURFACE} />
      <GroundGlow color="#49e9ff" radius={2.2} opacity={0.45} position={[0.3, -HOVER_Y + 0.03, 0]} />
    </group>
  )
})
