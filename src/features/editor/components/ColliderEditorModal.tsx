/**
 * Visual collider editor: shows one entity's model on its own, orbitable all
 * the way round, with its collider as a gizmo-driven proxy — drag to move
 * it, scale to resize it, or fit it to the model's bounds — next to the
 * entity's transform and collider fields.
 * @module features/editor/components/ColliderEditorModal
 */

import { createElement, memo, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { FiCrosshair, FiMaximize2, FiMove, FiShield } from 'react-icons/fi'
import { Modal } from '@/shared/components/Modal'
import { getEntityRenderer } from '@/engine/entityRegistry'
import { DEFAULT_BOX_SIZE, DEFAULT_CYLINDER_HEIGHT, DEFAULT_CYLINDER_RADIUS, defaultColliderForType } from '@/engine/colliders'
import { isCollisionMesh } from '@/models/shared/collisionMesh'
import { CollisionPublishContext } from '@/features/player/CollisionPublishContext'
import { ColliderSection, NumberField, Vector3Fields } from '@/features/editor/components/EditorFields'
import type { ColliderSpec, EditableEntity } from '@/engine/types'

/**
 * Props for {@link ColliderEditorModal}.
 */
interface ColliderEditorModalProps {
  /** Entity being edited, or `null` while closed. */
  entity: EditableEntity | null
  /** Entity updater. */
  onUpdate: (id: string, patch: Partial<EditableEntity>) => void
  /** Close handler. */
  onClose: () => void
}

/** What the gizmo does to the collider proxy. */
type GizmoMode = 'translate' | 'scale'

/** Debug color of the edited collider. */
const COLLIDER_COLOR = '#39d0ff'

/**
 * @param entity - Entity to read
 * @returns The collider the entity uses, if any
 */
function effectiveCollider(entity: EditableEntity): ColliderSpec | undefined {
  const spec = entity.collider ?? defaultColliderForType(entity.type)
  return spec && spec.shape !== 'none' ? spec : undefined
}

/**
 * Bounds of the visible model meshes under `root`, in `root`'s local frame.
 * @param root - Model group
 * @returns Local bounds, empty when nothing is loaded
 */
function measureModel(root: THREE.Object3D): THREE.Box3 {
  root.updateWorldMatrix(true, true)
  const box = new THREE.Box3()
  const inverse = new THREE.Matrix4().copy(root.matrixWorld).invert()
  const meshBox = new THREE.Box3()
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.visible || isCollisionMesh(mesh) || !mesh.geometry) return
    let current: THREE.Object3D | null = mesh
    while (current && current !== root) {
      if (!current.visible) return
      current = current.parent
    }
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    if (!mesh.geometry.boundingBox) return
    meshBox.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse)
    box.union(meshBox)
  })
  return box
}

/**
 * Props for {@link ColliderProxy}.
 */
interface ColliderProxyProps {
  /** Collider to draw, in the entity's local units. */
  spec: ColliderSpec
  /** Receives the proxy object the gizmo drives. */
  onObject: (object: THREE.Group | null) => void
}

/**
 * Collider drawn around its pivot: the box's center, the cylinder's base.
 * @param props - Collider and object callback
 * @returns Proxy group
 */
function ColliderProxy({ spec, onObject }: ColliderProxyProps) {
  const isCylinder = spec.shape === 'cylinder'
  const radius = spec.radius ?? DEFAULT_CYLINDER_RADIUS
  const height = spec.height ?? DEFAULT_CYLINDER_HEIGHT
  const size = spec.size ?? DEFAULT_BOX_SIZE
  const geometry = isCylinder ? <cylinderGeometry args={[radius, radius, height, 32]} /> : <boxGeometry args={size} />
  const inner: [number, number, number] = isCylinder ? [0, height / 2, 0] : [0, 0, 0]

  return (
    <group ref={onObject} position={spec.offset ?? [0, 0, 0]}>
      <mesh position={inner} renderOrder={998}>
        {geometry}
        <meshBasicMaterial color={COLLIDER_COLOR} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={inner} renderOrder={999}>
        {geometry}
        <meshBasicMaterial color={COLLIDER_COLOR} wireframe transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  )
}

/**
 * Props for {@link AutoFrame}.
 */
interface AutoFrameProps {
  /** Model group to keep framed. */
  targetRef: MutableRefObject<THREE.Group | null>
  /** Entity scale the model is shown at. */
  scale: number
  /** Bumped to request a re-frame. */
  frameRequest: number
}

/** Seconds after opening during which late-loading models are re-framed. */
const AUTO_FRAME_WINDOW = 4

/**
 * Frames the camera on the model when it opens, whenever its size changes
 * while it loads, and on request.
 * @param props - Model ref, scale and request counter
 * @returns Null (side-effect only)
 */
function AutoFrame({ targetRef, scale, frameRequest }: AutoFrameProps) {
  const { camera, controls } = useThree()
  const lastSize = useRef(-1)
  const elapsed = useRef(0)

  const frame = useCallback(() => {
    const root = targetRef.current
    const orbit = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    if (!root || !orbit) return false
    const box = measureModel(root)
    const size = box.isEmpty() ? 2 : box.getSize(new THREE.Vector3()).length() * scale
    const center = box.isEmpty() ? new THREE.Vector3(0, 1, 0) : box.getCenter(new THREE.Vector3()).multiplyScalar(scale)
    const distance = Math.max(size, 2) * 1.15
    camera.position.copy(center).add(new THREE.Vector3(1, 0.65, 1).normalize().multiplyScalar(distance))
    orbit.target.copy(center)
    orbit.update()
    lastSize.current = size
    return true
  }, [camera, controls, scale, targetRef])

  useEffect(() => {
    elapsed.current = 0
    lastSize.current = -1
  }, [frameRequest])

  useFrame((_, delta) => {
    if (elapsed.current > AUTO_FRAME_WINDOW) return
    elapsed.current += delta
    const root = targetRef.current
    if (!root) return
    const box = measureModel(root)
    const size = box.isEmpty() ? 2 : box.getSize(new THREE.Vector3()).length() * scale
    if (Math.abs(size - lastSize.current) > 0.05) frame()
  })

  return null
}

/**
 * Props for {@link ColliderScene}.
 */
interface ColliderSceneProps {
  /** Entity being edited. */
  entity: EditableEntity
  /** Gizmo mode. */
  mode: GizmoMode
  /** Entity updater. */
  onUpdate: (id: string, patch: Partial<EditableEntity>) => void
  /** Model group, shared with the "fit to model" action. */
  modelRef: MutableRefObject<THREE.Group | null>
  /** Bumped to request a re-frame. */
  frameRequest: number
}

/**
 * The modal's 3D content: the entity's model at the origin, its collider
 * proxy and the transform gizmo.
 * @param props - Entity, gizmo mode and shared refs
 * @returns Scene elements
 */
function ColliderScene({ entity, mode, onUpdate, modelRef, frameRequest }: ColliderSceneProps) {
  const spec = effectiveCollider(entity)
  const [proxy, setProxy] = useState<THREE.Group | null>(null)
  const displayEntity = useMemo<EditableEntity>(() => ({ ...entity, position: [0, 0, 0], rotationY: 0 }), [entity])

  const handleCommit = useCallback(() => {
    if (!proxy || !spec) return
    const offset: THREE.Vector3Tuple = [proxy.position.x, proxy.position.y, proxy.position.z]
    const { x: sx, y: sy, z: sz } = proxy.scale
    proxy.scale.set(1, 1, 1)
    if (spec.shape === 'cylinder') {
      const radius = (spec.radius ?? DEFAULT_CYLINDER_RADIUS) * Math.max(Math.abs(sx), Math.abs(sz))
      const height = (spec.height ?? DEFAULT_CYLINDER_HEIGHT) * Math.abs(sy)
      onUpdate(entity.id, { collider: { ...spec, offset, radius: Math.max(0.01, radius), height: Math.max(0.01, height) } })
      return
    }
    const [bx, by, bz] = spec.size ?? DEFAULT_BOX_SIZE
    const size: THREE.Vector3Tuple = [Math.max(0.01, bx * Math.abs(sx)), Math.max(0.01, by * Math.abs(sy)), Math.max(0.01, bz * Math.abs(sz))]
    onUpdate(entity.id, { collider: { ...spec, offset, size } })
  }, [entity.id, onUpdate, proxy, spec])

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 10, 5]} intensity={1.3} />
      <directionalLight position={[-5, 4, -6]} intensity={0.4} />
      <gridHelper args={[80, 80, '#3a4660', '#1c2336']} />
      <group scale={entity.scale}>
        <group ref={modelRef}>
          <CollisionPublishContext.Provider value={false}>
            {createElement(getEntityRenderer(entity.type), { entity: displayEntity })}
          </CollisionPublishContext.Provider>
        </group>
        {spec && <ColliderProxy spec={spec} onObject={setProxy} />}
      </group>
      {spec && proxy && <TransformControls object={proxy} mode={mode} onMouseUp={handleCommit} />}
      <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
      <AutoFrame targetRef={modelRef} scale={entity.scale} frameRequest={frameRequest} />
    </>
  )
}

/**
 * @param props - Edited entity, updater and close handler
 * @returns Modal, or nothing while closed
 */
export const ColliderEditorModal = memo(function ColliderEditorModal({ entity, onUpdate, onClose }: ColliderEditorModalProps) {
  const [mode, setMode] = useState<GizmoMode>('scale')
  const [frameRequest, setFrameRequest] = useState(0)
  const modelRef = useRef<THREE.Group | null>(null)

  /** Fits the collider to the model's visible bounds, keeping its shape (a box when it had none). */
  const fitToModel = useCallback(() => {
    const root = modelRef.current
    if (!entity || !root) return
    const box = measureModel(root)
    if (box.isEmpty()) return
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const base = effectiveCollider(entity)
    if (base?.shape === 'cylinder') {
      onUpdate(entity.id, {
        collider: { ...base, offset: [center.x, box.min.y, center.z], radius: Math.max(size.x, size.z) / 2, height: size.y },
      })
      return
    }
    onUpdate(entity.id, { collider: { ...(base ?? { shape: 'box' }), shape: 'box', offset: [center.x, center.y, center.z], size: [size.x, size.y, size.z] } })
  }, [entity, onUpdate])

  if (!entity) return null
  const hasCollider = !!effectiveCollider(entity)

  return (
    <Modal open title={`Colisión · ${entity.id}`} icon={<FiShield className="h-4 w-4 text-[#7fe0ff]" />} onClose={onClose} maxWidthClassName="max-w-6xl">
      <div className="flex min-h-[70vh] flex-1 flex-col md:flex-row">
        <div className="relative min-h-[50vh] flex-1 bg-[#0a0f1e]">
          <Canvas camera={{ fov: 45, position: [6, 4, 6], near: 0.05, far: 2000 }}>
            <ColliderScene entity={entity} mode={mode} onUpdate={onUpdate} modelRef={modelRef} frameRequest={frameRequest} />
          </Canvas>
          <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-parchment/40">
            Arrastra para girar 360° • rueda para acercar • clic derecho para desplazar
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-gold/10 bg-black/25 p-3 md:w-80 md:border-t-0 md:border-l">
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ['translate', 'Mover', FiMove],
                ['scale', 'Tamaño', FiMaximize2],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                disabled={!hasCollider}
                onClick={() => setMode(value)}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-30 ${
                  mode === value ? 'bg-[#39d0ff] text-[#04121a]' : 'bg-white/10 text-parchment hover:bg-white/15'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={fitToModel}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white/10 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-parchment hover:bg-white/15"
            >
              <FiShield className="h-3.5 w-3.5" /> Ajustar al modelo
            </button>
            <button
              type="button"
              onClick={() => setFrameRequest((n) => n + 1)}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white/10 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-parchment hover:bg-white/15"
            >
              <FiCrosshair className="h-3.5 w-3.5" /> Encuadrar
            </button>
          </div>

          <div className="rounded-md border border-white/5 bg-black/20 p-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold/80">Elemento en la escena</div>
            <div className="mt-2">
              <Vector3Fields labels={['x', 'y', 'z']} value={entity.position} onChange={(position) => onUpdate(entity.id, { position })} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <NumberField label="Rot Y" step={0.05} value={entity.rotationY} onChange={(rotationY) => onUpdate(entity.id, { rotationY })} />
              <NumberField label="Escala" step={0.05} value={entity.scale} fallback={1} onChange={(scale) => onUpdate(entity.id, { scale: Math.max(0.01, scale) })} />
            </div>
          </div>

          <ColliderSection entity={entity} onUpdate={onUpdate} />
          <div className="text-[10px] leading-4 text-parchment/40">
            La colisión se guarda en el elemento y se exporta con el JSON de la escena. Aquí se muestra sin rotación; en la escena gira con el elemento.
          </div>
        </div>
      </div>
    </Modal>
  )
})
