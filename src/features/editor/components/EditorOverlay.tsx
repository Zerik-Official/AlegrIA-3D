import { memo, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { FiCopy, FiMove, FiRotateCw, FiMaximize2, FiPlus, FiTrash2, FiDownload, FiX, FiBox, FiZap, FiEye, FiEyeOff } from 'react-icons/fi'
import type { Vector3Tuple } from 'three'
import type { EditableEntity } from '@/features/editor/config/editableEntities'
import type { EntityCatalogItem, SceneId } from '@/engine/config/entityCatalog'
import type { GamePhase } from '@/shared/types'
import type { SpawnResolver } from '@/features/editor/components/EditorSpawnProbe'
import { phaseSceneRegistry } from '@/app/engine/PhaseSceneRegistry'
import { ModelBrowserModal } from '@/features/editor/components/ModelBrowserModal'
import { Select } from '@/components/ui/Select'
import { ColliderSection, FieldLabel, INPUT_CLASS, NumberField, Vector3Fields } from '@/features/editor/components/EditorFields'
import { ColliderEditorModal } from '@/features/editor/components/ColliderEditorModal'
import { DEFAULT_AREA_SIZE } from '@/features/player/renderers/WalkAreaRenderer'
import { setCollisionDebugVisible, useCollisionDebugVisible } from '@/features/editor/state/collisionDebug'

/**
 * Props for {@link EditorOverlay}.
 */
interface EditorOverlayProps {
  /** Whether editor is enabled. */
  enabled: boolean
  /** Addable element types for the current scene — drives the "Add element" picker. */
  catalog: EntityCatalogItem[]
  /** All entities. */
  entities: EditableEntity[]
  /** Selected id. */
  selectedId: string | null
  /** Current gizmo mode. */
  mode: 'translate' | 'rotate' | 'scale'
  /** Mode setter. */
  onModeChange: (m: 'translate' | 'rotate' | 'scale') => void
  /** Selection setter. */
  onSelect: (id: string | null) => void
  /** Entity updater. */
  onUpdate: (id: string, patch: Partial<EditableEntity>) => void
  /** Add entity handler. */
  onAdd: (e: EditableEntity) => void
  /** Remove handler. */
  onRemove: (id: string) => void
  /** Export handler. */
  onExport: () => string
  /** Close editor. */
  onClose: () => void
  /** Current game phase, shown next to the jump control. */
  currentPhase?: GamePhase
  /** Story checkpoint the experience is at, selected in the jump control. */
  currentCheckpointId?: string
  /** Jumps to a story checkpoint without the walk/wormhole sequence. */
  onJumpToCheckpoint?: (id: string) => void
  /** Scene currently edited, used to filter the model browser to that phase. */
  currentScene?: SceneId
  /** Resolves where the crosshair would spawn a new element; `null` result means the camera is far from the map. */
  spawnResolverRef?: MutableRefObject<SpawnResolver | null>
}

/** Width of the editor panel; the crosshair sits at the center of the canvas area left of it. */
const PANEL_WIDTH = '22.5rem'

/**
 * Tailwind overlay for the position editor.
 * Shows list, transform and collider inputs, add/remove, the collision view
 * toggle, the spawn crosshair and JSON export.
 *
 * @param props - Overlay state
 * @returns Overlay element
 */
export const EditorOverlay = memo(function EditorOverlay({
  enabled,
  catalog,
  entities,
  selectedId,
  mode,
  onModeChange,
  onSelect,
  onUpdate,
  onAdd,
  onRemove,
  onExport,
  onClose,
  currentPhase,
  currentCheckpointId,
  onJumpToCheckpoint,
  currentScene,
  spawnResolverRef,
}: EditorOverlayProps) {
  const selected = entities.find((e) => e.id === selectedId) ?? null
  const [addType, setAddType] = useState<string>(catalog[0]?.type ?? 'generic')
  const [isModelBrowserOpen, setIsModelBrowserOpen] = useState(false)
  const [colliderEditorId, setColliderEditorId] = useState<string | null>(null)
  const colliderEditorEntity = entities.find((e) => e.id === colliderEditorId) ?? null
  const collisionsVisible = useCollisionDebugVisible()
  const crosshairRef = useRef<HTMLDivElement>(null)
  const jumpTargets = phaseSceneRegistry.listJumpTargets()
  const hasJump = typeof onJumpToCheckpoint === 'function' && typeof currentPhase === 'string'
  const colliderCount = entities.filter((e) => e.type === 'collider').length
  const walkAreaCount = entities.filter((e) => e.type === 'walk-area').length

  const jumpOptions = useMemo(() => jumpTargets.map((target) => ({ value: target.id, label: target.label })), [jumpTargets])
  const catalogOptions = useMemo(() => catalog.map((item) => ({ value: item.type, label: item.label })), [catalog])

  /**
   * Where a surface element spawns: what the crosshair points at, below the
   * camera when it points at nothing, or `fallback` when the camera is far
   * from the map.
   * @param fallback - Position used when the camera is far from the map
   * @returns Spawn position
   */
  const resolveSpawnPosition = useCallback(
    (fallback: Vector3Tuple): Vector3Tuple => {
      const rect = crosshairRef.current?.getBoundingClientRect()
      const resolver = spawnResolverRef?.current
      if (!rect || !resolver) return fallback
      const spot = resolver(rect.left + rect.width / 2, rect.top + rect.height / 2)
      if (!spot) return fallback
      return [spot[0], spot[1] + fallback[1], spot[2]]
    },
    [spawnResolverRef]
  )

  /**
   * Handles quick-add from the model browser: creates an entity whose `type`
   * is the model registry key itself, so `entityRegistry.getEntityRenderer`
   * resolves it via the generic phase2 fallback.
   * @param modelKey - Registry key, e.g. `phase2/houses/casa-cafe`
   */
  const handleModelQuickAdd = useCallback(
    (modelKey: string) => {
      onAdd({ id: `${modelKey.replace(/\//g, '-')}-${Date.now()}`, type: modelKey, position: resolveSpawnPosition([0, 0, 0]), rotationY: 0, scale: 1 })
      setIsModelBrowserOpen(false)
    },
    [onAdd, resolveSpawnPosition]
  )

  useEffect(() => {
    if (catalog.length && !catalog.some((c) => c.type === addType)) {
      setAddType(catalog[0].type)
    }
  }, [catalog, addType])

  const handleAdd = useCallback(() => {
    const item = catalog.find((c) => c.type === addType)
    const base: Omit<EditableEntity, 'id' | 'type'> = structuredClone(item?.defaultEntity ?? { position: [0, 0, 0], rotationY: 0, scale: 1 })
    if (item?.variantFromScene && currentScene) base.variant = currentScene
    if (item?.placement !== 'sky') base.position = resolveSpawnPosition(base.position)
    onAdd({ id: `${addType}-${Date.now()}`, type: addType, ...base })
  }, [addType, catalog, currentScene, onAdd, resolveSpawnPosition])

  const handleExport = useCallback(() => {
    const json = onExport()
    navigator.clipboard.writeText(json).catch(() => {})
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'phase1-positions.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [onExport])

  if (!enabled) return null

  return (
    <>
      <div
        ref={crosshairRef}
        className="pointer-events-none fixed top-1/2 z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `calc((100vw - ${PANEL_WIDTH}) / 2)` }}
      >
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/80 shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/80 shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
      </div>

      <div
        className="pointer-events-auto fixed inset-y-0 right-0 z-30 flex max-w-full flex-col overflow-x-hidden overflow-y-auto border-l border-white/10 bg-[#0a0f1e]/92 p-4 text-parchment shadow-[-12px_0_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        style={{ width: PANEL_WIDTH }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="truncate font-cinzel text-[11px] tracking-[0.22em] uppercase text-gold">Editor de Posiciones</div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsModelBrowserOpen(true)}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-white/15"
            >
              <FiBox className="h-3.5 w-3.5" /> Modelos
            </button>
            <button type="button" onClick={onClose} className="cursor-pointer rounded-full bg-white/10 p-1.5 hover:bg-white/15">
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
        {hasJump && (
          <div className="mt-3 shrink-0 rounded-lg border border-gold/20 bg-black/25 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-gold/80">
              <FiZap className="h-3 w-3" /> Salto rápido de fase
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <Select
                  value={jumpTargets.some((t) => t.id === currentCheckpointId) ? (currentCheckpointId ?? '') : (jumpTargets[0]?.id ?? '')}
                  options={jumpOptions}
                  onChange={(id) => onJumpToCheckpoint?.(id)}
                />
              </div>
              <span className="inline-flex shrink-0 items-center rounded-md bg-gold/15 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-gold">{currentPhase}</span>
            </div>
            <div className="mt-1.5 text-[10px] leading-4 text-parchment/40">Salta a ese punto de la historia sin pasar por el vórtice; el libro y los portales siguen desde ahí.</div>
          </div>
        )}
        <div className="mt-3 flex shrink-0 gap-1.5">
          {(
            [
              ['translate', 'Mover', FiMove],
              ['rotate', 'Rotar', FiRotateCw],
              ['scale', 'Escala', FiMaximize2],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => onModeChange(value)}
              className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${mode === value ? 'bg-gold text-[#1a1205]' : 'bg-white/10 hover:bg-white/15'}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex shrink-0 items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <Select value={addType} options={catalogOptions} onChange={setAddType} placeholder="Elemento" />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!catalog.length}
            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-white/10 px-2.5 py-1.5 text-[11px] hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiPlus className="h-3 w-3" /> Añadir
          </button>
        </div>
        <div className="mt-1.5 shrink-0 text-[10px] leading-4 text-parchment/40">Se añade donde apunta la cruceta; si no apunta a nada, debajo de la cámara.</div>
        <button
          type="button"
          onClick={() => setCollisionDebugVisible(!collisionsVisible)}
          className={`mt-3 flex shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
            collisionsVisible ? 'bg-[#39d0ff] text-[#04121a]' : 'bg-white/10 hover:bg-white/15'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {collisionsVisible ? <FiEye className="h-3.5 w-3.5" /> : <FiEyeOff className="h-3.5 w-3.5" />} Colisiones y límites
          </span>
          <span className="truncate text-[10px] font-normal normal-case tracking-normal opacity-70">
            {colliderCount} del mundo • {walkAreaCount} zonas
          </span>
        </button>
        {collisionsVisible && (
          <div className="mt-1.5 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-parchment/50">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#39d0ff]" /> JSON (editable)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#7a7f8c]" /> Etiqueta inactiva
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#ff9a3c]" /> Del modelo (.glb)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#5cff8a]" /> Zona caminable
            </span>
          </div>
        )}
        <div className="mt-3 flex min-h-32 flex-1 flex-col overflow-hidden rounded-lg border border-white/5 bg-black/20">
          <div className="shrink-0 px-2 pt-2 pb-1 text-[11px] tracking-[0.12em] uppercase text-parchment/50">Elementos ({entities.length})</div>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2">
            {entities.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onSelect(e.id)}
                className={`flex w-full min-w-0 shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[12px] ${selectedId === e.id ? 'bg-gold text-[#1a1205]' : 'bg-white/5 hover:bg-white/10 text-parchment/80'}`}
              >
                <span className="min-w-0 flex-1 truncate">{e.id}</span>
                <span className="max-w-[55%] shrink-0 truncate text-[10px] opacity-60">{e.type}</span>
              </button>
            ))}
          </div>
        </div>
        {selected && (
          <div className="mt-3 max-h-[46vh] shrink-0 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-semibold text-[12px] text-gold">{selected.id}</span>
              <button
                type="button"
                onClick={() => onRemove(selected.id)}
                className="shrink-0 cursor-pointer rounded-md bg-red-500/15 p-1.5 text-red-300 hover:bg-red-500/25"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2">
              <Vector3Fields labels={['x', 'y', 'z']} value={selected.position} onChange={(position) => onUpdate(selected.id, { position })} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <NumberField label="Rot Y" step={0.05} value={selected.rotationY} onChange={(rotationY) => onUpdate(selected.id, { rotationY })} />
              <NumberField label="Scale" step={0.05} value={selected.scale} fallback={1} onChange={(scale) => onUpdate(selected.id, { scale })} />
            </div>
            <FieldLabel label="Variante" className="mt-2">
              <input
                type="text"
                placeholder="ej. medium, #e85a3a, 5.2"
                value={selected.variant ?? ''}
                onChange={(ev) => onUpdate(selected.id, { variant: ev.target.value || undefined })}
                className={INPUT_CLASS}
              />
            </FieldLabel>
            {(selected.type === 'flying-car' || selected.type === 'flying-train') && (
              <FieldLabel label="Carril de vuelo (opcional)" className="mt-2">
                <input
                  type="text"
                  placeholder="ej. carsEast, trainHigh"
                  value={selected.title ?? ''}
                  onChange={(ev) => onUpdate(selected.id, { title: ev.target.value || undefined })}
                  className={INPUT_CLASS}
                />
              </FieldLabel>
            )}
            {(selected.type === 'ad-tower' ||
              selected.type === 'screen-building' ||
              (selected.type === 'parade-vehicle' && selected.variant === 'carrosa-riwi') ||
              selected.videoSrc !== undefined ||
              selected.videoSrcs !== undefined) && (
              <>
                <FieldLabel label="Video (URL, opcional — usado si no hay lista)" className="mt-2">
                  <input
                    type="text"
                    placeholder="/videos/cityIntro/first.mp4"
                    value={selected.videoSrc ?? ''}
                    onChange={(ev) => onUpdate(selected.id, { videoSrc: ev.target.value || undefined })}
                    className={INPUT_CLASS}
                  />
                </FieldLabel>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] uppercase tracking-widest text-parchment/50">Videos en bucle (lista)</span>
                    <button
                      type="button"
                      onClick={() => onUpdate(selected.id, { videoSrcs: [...(selected.videoSrcs ?? []), ''] })}
                      className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] hover:bg-white/15"
                    >
                      <FiPlus className="h-3 w-3" /> Añadir video
                    </button>
                  </div>
                  {(selected.videoSrcs ?? []).map((src, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="/videos/mocadevia/mocadevia-1.mp4"
                        value={src}
                        onChange={(ev) => {
                          const next = [...(selected.videoSrcs ?? [])]
                          next[i] = ev.target.value
                          onUpdate(selected.id, { videoSrcs: next })
                        }}
                        className={INPUT_CLASS}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (selected.videoSrcs ?? []).filter((_, j) => j !== i)
                          onUpdate(selected.id, { videoSrcs: next.length ? next : undefined })
                        }}
                        className="shrink-0 cursor-pointer rounded-md bg-red-500/15 p-1.5 text-red-300 hover:bg-red-500/25"
                      >
                        <FiTrash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="text-[10px] leading-4 text-parchment/40">
                    Se reproducen en orden, muteados; al terminar uno empieza el siguiente y vuelve al primero al final.
                  </div>
                </div>
              </>
            )}
            {(selected.type === 'sepia-photo' || selected.imageSrc !== undefined) && (
              <>
                <FieldLabel label="Imagen (URL)" className="mt-2">
                  <input
                    type="text"
                    placeholder="https://... o /images/placeholders/mi-foto.jpg"
                    value={selected.imageSrc ?? ''}
                    onChange={(ev) => onUpdate(selected.id, { imageSrc: ev.target.value || undefined })}
                    className={INPUT_CLASS}
                  />
                </FieldLabel>
                <FieldLabel label="Título" className="mt-2">
                  <input
                    type="text"
                    value={selected.title ?? ''}
                    onChange={(ev) => onUpdate(selected.id, { title: ev.target.value || undefined })}
                    className={INPUT_CLASS}
                  />
                </FieldLabel>
                <FieldLabel label="Descripción" className="mt-2">
                  <textarea
                    value={selected.description ?? ''}
                    onChange={(ev) => onUpdate(selected.id, { description: ev.target.value || undefined })}
                    rows={2}
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </FieldLabel>
              </>
            )}
            {selected.type === 'walk-area' ? (
              <div className="mt-3 rounded-md border border-[#5cff8a]/20 bg-[#5cff8a]/5 p-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8dffab]">Zona caminable</div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <NumberField
                    label="Ancho X"
                    value={(selected.areaSize ?? DEFAULT_AREA_SIZE)[0]}
                    fallback={DEFAULT_AREA_SIZE[0]}
                    onChange={(width) => onUpdate(selected.id, { areaSize: [Math.max(0.5, width), (selected.areaSize ?? DEFAULT_AREA_SIZE)[1]] })}
                  />
                  <NumberField
                    label="Fondo Z"
                    value={(selected.areaSize ?? DEFAULT_AREA_SIZE)[1]}
                    fallback={DEFAULT_AREA_SIZE[1]}
                    onChange={(depth) => onUpdate(selected.id, { areaSize: [(selected.areaSize ?? DEFAULT_AREA_SIZE)[0], Math.max(0.5, depth)] })}
                  />
                </div>
                <div className="mt-1.5 text-[10px] leading-4 text-parchment/40">
                  El jugador puede andar dentro de la unión de todas las zonas de la escena. Se escala con el elemento; la rotación se ignora.
                </div>
              </div>
            ) : (
              <ColliderSection entity={selected} onUpdate={onUpdate} onOpenEditor={() => setColliderEditorId(selected.id)} />
            )}
            <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[10px] text-parchment/40">
              <FiCopy className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {selected.position.map((n) => n.toFixed(2)).join(', ')} • rY {selected.rotationY.toFixed(2)} • s {selected.scale.toFixed(2)}
              </span>
            </div>
          </div>
        )}
        <div className="mt-3 flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={handleExport}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-gold px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1a1205] hover:bg-gold-bright"
          >
            <FiDownload className="h-3.5 w-3.5" /> Exportar JSON
          </button>
        </div>
        <div className="mt-2 shrink-0 text-[10px] leading-4 text-parchment/30">
          Teclas: <span className="text-parchment/60">W/E/R</span> traslación/rotación/escala • <span className="text-parchment/60">F2</span> toggle editor • <span className="text-parchment/60">Alt + clic derecho</span> seleccionar
          <br />
          Cámara: <span className="text-parchment/60">WASD</span> mover • <span className="text-parchment/60">Shift/Ctrl</span> subir/bajar • arrastrar para orbitar
        </div>

        <ColliderEditorModal entity={colliderEditorEntity} onUpdate={onUpdate} onClose={() => setColliderEditorId(null)} />
        <ModelBrowserModal open={isModelBrowserOpen} onClose={() => setIsModelBrowserOpen(false)} currentScene={currentScene} onQuickAdd={handleModelQuickAdd} />
      </div>
    </>
  )
})
