import { memo, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Bounds, Center } from '@react-three/drei'
import { FiBox, FiFilter, FiLoader, FiPlus } from 'react-icons/fi'
import { Modal } from '@/shared/components/Modal'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { modelPreviews } from '@/features/editor/config/modelPreviews'
import type { SceneId } from '@/engine/config/entityCatalog'
import { allModelUrls, preloadModels } from '@/features/editor/utils/preloadModels'

/** Whether every registry model has been loaded this session, shared by every modal instance. */
let allModelsLoaded = false

/**
 * Props for {@link ModelBrowserModal}.
 */
interface ModelBrowserModalProps {
  /** Whether the modal is open. */
  open: boolean
  /** Close handler. */
  onClose: () => void
  /** Scene currently edited, used to filter the list to that phase's models. */
  currentScene?: SceneId
  /** Called when the user quick-adds the selected model to the scene. */
  onQuickAdd?: (modelKey: string) => void
}

/**
 * Extracts the group prefix (`phase1`, `library`, ...) from a registry key.
 * @param key - Registry key, e.g. `'phase1/bahareque-house-short'`
 * @returns The prefix before the first `/`, or `'otros'` when there isn't one
 */
function groupOf(key: string): string {
  const i = key.indexOf('/')
  return i === -1 ? 'otros' : key.slice(0, i)
}

/**
 * Shown in the preview pane when a registry entry has no reachable `.glb` —
 * the in-game scene would render its procedural fallback instead.
 * @returns Placeholder mesh
 */
function PreviewPlaceholder() {
  return (
    <mesh rotation={[0.4, 0.6, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3d2b1f" wireframe />
    </mesh>
  )
}

/**
 * Editor tool for browsing every registered model key and previewing its
 * live `.glb` (auto-framed) when one is reachable at `public/models/...`.
 * Built on the shared {@link Modal} shell.
 *
 * @param props - Modal state
 * @returns Modal overlay or null
 */
export const ModelBrowserModal = memo(function ModelBrowserModal({ open, onClose, currentScene, onQuickAdd }: ModelBrowserModalProps) {
  const entries = useMemo(() => Object.entries(modelRegistry), [])
  const [onlyCurrentPhase, setOnlyCurrentPhase] = useState<boolean>(!!currentScene)
  const [search, setSearch] = useState<string>('')
  const [allReady, setAllReady] = useState(allModelsLoaded)
  const loadingAll = open && !onlyCurrentPhase && !allReady

  useEffect(() => {
    if (!loadingAll) return
    let cancelled = false
    preloadModels(allModelUrls()).then(() => {
      allModelsLoaded = true
      if (!cancelled) setAllReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [loadingAll])

  const filteredEntries = useMemo(() => {
    let list = entries
    if (onlyCurrentPhase && currentScene) {
      const prefix = `${currentScene}/`
      list = list.filter(([key]) => key.startsWith(prefix) || key.startsWith(`${currentScene}`))
      if (currentScene === 'phase2') {
        list = list.filter(([key]) => key.startsWith('phase2/'))
      }
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(([key]) => key.toLowerCase().includes(q))
    }
    return list
  }, [entries, onlyCurrentPhase, currentScene, search])

  const groups = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const [key] of filteredEntries) {
      const group = groupOf(key)
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(key)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filteredEntries])

  const [selectedKey, setSelectedKey] = useState<string>(entries[0]?.[0] ?? '')

  const effectiveSelectedKey = filteredEntries.some(([k]) => k === selectedKey) ? selectedKey : (filteredEntries[0]?.[0] ?? selectedKey)
  const selected = modelRegistry[effectiveSelectedKey]
  const PreviewComponent = modelPreviews[effectiveSelectedKey]

  /**
   * Handles quick-add of the currently previewed model to the edited scene.
   */
  const handleQuickAdd = () => {
    if (!onQuickAdd || !effectiveSelectedKey) return
    onQuickAdd(effectiveSelectedKey)
  }

  return (
    <Modal open={open} title="Explorador de Modelos" icon={<FiBox className="h-4 w-4 text-gold" />} onClose={onClose} maxWidthClassName="max-w-5xl">
      <div className="flex min-h-[60vh] flex-1">
        <div className="flex w-64 shrink-0 flex-col border-r border-gold/10 bg-black/20">
          <div className="border-b border-gold/10 p-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setOnlyCurrentPhase((v) => !v)}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${onlyCurrentPhase ? 'bg-gold text-[#1a1205]' : 'bg-white/10 text-parchment/70 hover:bg-white/15'}`}
              >
                <FiFilter className="h-3 w-3" /> {onlyCurrentPhase ? `Solo ${currentScene ?? 'fase'}` : 'Todos'}
              </button>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar…"
              className="mt-2 w-full rounded-md bg-white/10 px-2 py-1.5 text-[11px] text-parchment placeholder:text-parchment/30 outline-none focus:bg-white/15"
            />
            <div className="mt-1 text-[10px] text-parchment/35">{filteredEntries.length} modelos</div>
          </div>
          <div className="relative flex-1 overflow-y-auto p-2">
            {loadingAll && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0a0f1e]/85 text-[11px] text-parchment/70">
                <FiLoader className="h-5 w-5 animate-spin text-gold" />
                Cargando modelos de todas las fases…
              </div>
            )}
            {groups.map(([group, keys]) => (
              <div key={group} className="mb-2">
                <div className="px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-parchment/40">{group}</div>
                {keys.map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={`block w-full cursor-pointer truncate rounded-md px-2 py-1.5 text-left text-[12px] ${
                      effectiveSelectedKey === key ? 'bg-gold text-[#1a1205]' : 'text-parchment/75 hover:bg-white/10'
                    }`}
                  >
                    {key.slice(group.length + 1) || key}
                  </button>
                ))}
              </div>
            ))}
            {!filteredEntries.length && <div className="px-2 py-6 text-center text-[11px] text-parchment/40">Sin resultados</div>}
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="relative flex-1 bg-[#0a0f1e]">
            {selected && (
              <Canvas key={selectedKey} camera={{ fov: 42, position: [2.4, 1.8, 2.8] }} shadows>
                <ambientLight intensity={0.6} />
                <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow />
                <Bounds fit clip observe margin={2.4}>
                  <Center>
                    <ModelLoader src={selected.path} fallback={PreviewComponent ? <PreviewComponent /> : <PreviewPlaceholder />} />
                  </Center>
                </Bounds>
                <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
              </Canvas>
            )}
          </div>
          <div className="border-t border-gold/10 bg-black/25 px-4 py-3 text-[11px] text-parchment/60">
            <div className="flex items-center gap-2 font-semibold text-parchment">
              <FiBox className="h-3.5 w-3.5 text-gold" /> {effectiveSelectedKey}
            </div>
            <div className="mt-1 truncate">
              Ruta: <span className="text-parchment/40">{selected?.path}</span>
            </div>
            <div className="mt-1">
              Fallback procedural: <span className="text-parchment/40">{selected?.fallback}</span>
              {!PreviewComponent && <span className="text-parchment/30"> (aún sin diseño — cuadro genérico)</span>}
            </div>
            {onQuickAdd && (
              <button
                onClick={handleQuickAdd}
                disabled={!effectiveSelectedKey}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-gold px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#1a1205] hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiPlus className="h-3.5 w-3.5" /> Añadir a escena
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
})
