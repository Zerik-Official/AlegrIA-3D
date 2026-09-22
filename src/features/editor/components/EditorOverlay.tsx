import { memo, useCallback, useEffect, useState } from 'react'
import { FiCopy, FiMove, FiRotateCw, FiMaximize2, FiPlus, FiTrash2, FiDownload, FiX, FiBox } from 'react-icons/fi'
import type { EditableEntity } from '@/features/editor/config/editableEntities'
import type { EntityCatalogItem } from '@/engine/config/entityCatalog'
import { ModelBrowserModal } from '@/features/editor/components/ModelBrowserModal'

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
}

/**
 * Tailwind overlay for the position editor.
 * Shows list, transform inputs, add/remove and JSON export.
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
}: EditorOverlayProps) {
  const selected = entities.find((e) => e.id === selectedId) ?? null
  const [addType, setAddType] = useState<string>(catalog[0]?.type ?? 'generic')
  const [isModelBrowserOpen, setIsModelBrowserOpen] = useState(false)

  useEffect(() => {
    if (catalog.length && !catalog.some((c) => c.type === addType)) {
      setAddType(catalog[0].type)
    }
  }, [catalog, addType])

  const handleAdd = useCallback(() => {
    const item = catalog.find((c) => c.type === addType)
    const base = item?.defaultEntity ?? { position: [0, 0, 0], rotationY: 0, scale: 1 }
    onAdd({ id: `${addType}-${Date.now()}`, type: addType, ...base })
  }, [addType, catalog, onAdd])

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
    <div className="pointer-events-auto fixed inset-y-0 right-0 z-30 flex w-90 flex-col border-l border-white/10 bg-[#0a0f1e]/92 p-4 text-parchment shadow-[-12px_0_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="font-cinzel text-[11px] tracking-[0.22em] uppercase text-gold">Editor de Posiciones</div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsModelBrowserOpen(true)}
            className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] hover:bg-white/15"
          >
            <FiBox className="h-3.5 w-3.5" /> Modelos
          </button>
          <button onClick={onClose} className="rounded-full bg-white/10 p-1.5 hover:bg-white/15">
            <FiX className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        <button onClick={() => onModeChange('translate')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${mode === 'translate' ? 'bg-gold text-[#1a1205]' : 'bg-white/10 hover:bg-white/15'}`}>
          <FiMove className="h-3.5 w-3.5" /> Mover
        </button>
        <button onClick={() => onModeChange('rotate')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${mode === 'rotate' ? 'bg-gold text-[#1a1205]' : 'bg-white/10 hover:bg-white/15'}`}>
          <FiRotateCw className="h-3.5 w-3.5" /> Rotar
        </button>
        <button onClick={() => onModeChange('scale')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${mode === 'scale' ? 'bg-gold text-[#1a1205]' : 'bg-white/10 hover:bg-white/15'}`}>
          <FiMaximize2 className="h-3.5 w-3.5" /> Escala
        </button>
      </div>
      <div className="mt-3 flex gap-1.5">
        <select
          value={addType}
          onChange={(ev) => setAddType(ev.target.value)}
          className="flex-1 rounded-md bg-white/10 px-2 py-1.5 text-[11px] text-parchment outline-none focus:bg-white/15"
        >
          {catalog.map((item) => (
            <option key={item.type} value={item.type} className="text-black">
              {item.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!catalog.length}
          className="flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1.5 text-[11px] hover:bg-white/15 disabled:opacity-40"
        >
          <FiPlus className="h-3 w-3" /> Añadir
        </button>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.12em] uppercase text-parchment/50">Elementos ({entities.length})</span>
        </div>
        <div className="flex flex-col gap-1">
          {entities.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelect(e.id)}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] ${selectedId === e.id ? 'bg-gold text-[#1a1205]' : 'bg-white/5 hover:bg-white/10 text-parchment/80'}`}
            >
              <span className="truncate">{e.id}</span>
              <span className="text-[10px] opacity-60">{e.type}</span>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <div className="mt-3 rounded-lg border border-white/5 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[12px] text-gold">{selected.id}</span>
            <button onClick={() => onRemove(selected.id)} className="rounded-md bg-red-500/15 p-1.5 text-red-300 hover:bg-red-500/25">
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(['x', 'y', 'z'] as const).map((axis, idx) => (
              <label key={axis} className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-parchment/50">{axis}</span>
                <input
                  type="number"
                  step={0.1}
                  value={Number(selected.position[idx].toFixed(2))}
                  onChange={(ev) => {
                    const v = parseFloat(ev.target.value) || 0
                    const next: [number, number, number] = [...selected.position] as [number, number, number]
                    next[idx] = v
                    onUpdate(selected.id, { position: next })
                  }}
                  className="w-full rounded-md bg-white/10 px-1.5 py-1 text-[12px] text-parchment outline-none focus:bg-white/15"
                />
              </label>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-parchment/50">Rot Y</span>
              <input
                type="number"
                step={0.05}
                value={Number(selected.rotationY.toFixed(2))}
                onChange={(ev) => onUpdate(selected.id, { rotationY: parseFloat(ev.target.value) || 0 })}
                className="w-full rounded-md bg-white/10 px-1.5 py-1 text-[12px] text-parchment outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-parchment/50">Scale</span>
              <input
                type="number"
                step={0.05}
                value={Number(selected.scale.toFixed(2))}
                onChange={(ev) => onUpdate(selected.id, { scale: parseFloat(ev.target.value) || 1 })}
                className="w-full rounded-md bg-white/10 px-1.5 py-1 text-[12px] text-parchment outline-none"
              />
            </label>
          </div>
          <label className="mt-2 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-parchment/50">Variante</span>
            <input
              type="text"
              placeholder="ej. medium, #e85a3a, 5.2"
              value={selected.variant ?? ''}
              onChange={(ev) => onUpdate(selected.id, { variant: ev.target.value || undefined })}
              className="w-full rounded-md bg-white/10 px-1.5 py-1 text-[12px] text-parchment outline-none focus:bg-white/15"
            />
          </label>
          {(selected.type === 'sepia-photo' || selected.imageSrc !== undefined) && (
            <>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-parchment/50">Imagen (URL)</span>
                <input
                  type="text"
                  placeholder="/images/placeholders/mi-foto.jpg"
                  value={selected.imageSrc ?? ''}
                  onChange={(ev) => onUpdate(selected.id, { imageSrc: ev.target.value || undefined })}
                  className="w-full rounded-md bg-white/10 px-1.5 py-1 text-[12px] text-parchment outline-none focus:bg-white/15"
                />
              </label>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-parchment/50">Título</span>
                <input
                  type="text"
                  value={selected.title ?? ''}
                  onChange={(ev) => onUpdate(selected.id, { title: ev.target.value || undefined })}
                  className="w-full rounded-md bg-white/10 px-1.5 py-1 text-[12px] text-parchment outline-none focus:bg-white/15"
                />
              </label>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-parchment/50">Descripción</span>
                <textarea
                  value={selected.description ?? ''}
                  onChange={(ev) => onUpdate(selected.id, { description: ev.target.value || undefined })}
                  rows={2}
                  className="w-full resize-none rounded-md bg-white/10 px-1.5 py-1 text-[12px] text-parchment outline-none focus:bg-white/15"
                />
              </label>
            </>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-parchment/40">
            <FiCopy className="h-3 w-3" />
            {selected.position.map((n) => n.toFixed(2)).join(', ')} • rY {selected.rotationY.toFixed(2)} • s {selected.scale.toFixed(2)}
          </div>
        </div>
      )}
      <div className="mt-3 flex gap-1.5">
        <button onClick={handleExport} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-gold px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1a1205] hover:bg-gold-bright">
          <FiDownload className="h-3.5 w-3.5" /> Exportar JSON
        </button>
      </div>
      <div className="mt-2 text-[10px] leading-4 text-parchment/30">
        Teclas: <span className="text-parchment/60">W/E/R</span> traslación/rotación/escala • <span className="text-parchment/60">F2</span> toggle editor
        <br />
        Cámara: <span className="text-parchment/60">WASD</span> mover • <span className="text-parchment/60">Shift/Ctrl</span> subir/bajar • arrastrar para orbitar
      </div>

      <ModelBrowserModal open={isModelBrowserOpen} onClose={() => setIsModelBrowserOpen(false)} />
    </div>
  )
})
