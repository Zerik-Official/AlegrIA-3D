import { memo, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Bounds, Center } from '@react-three/drei'
import { FiBox } from 'react-icons/fi'
import { Modal } from '@/shared/components/Modal'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'

/**
 * Props for {@link ModelBrowserModal}.
 */
interface ModelBrowserModalProps {
  /** Whether the modal is open. */
  open: boolean
  /** Close handler. */
  onClose: () => void
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
export const ModelBrowserModal = memo(function ModelBrowserModal({ open, onClose }: ModelBrowserModalProps) {
  const entries = useMemo(() => Object.entries(modelRegistry), [])
  const groups = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const [key] of entries) {
      const group = groupOf(key)
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(key)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [entries])

  const [selectedKey, setSelectedKey] = useState<string>(entries[0]?.[0] ?? '')
  const selected = modelRegistry[selectedKey]

  return (
    <Modal open={open} title="Explorador de Modelos" icon={<FiBox className="h-4 w-4 text-gold" />} onClose={onClose} maxWidthClassName="max-w-5xl">
      <div className="flex min-h-[60vh] flex-1">
        <div className="w-56 shrink-0 overflow-y-auto border-r border-gold/10 bg-black/20 p-2">
          {groups.map(([group, keys]) => (
            <div key={group} className="mb-2">
              <div className="px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-parchment/40">{group}</div>
              {keys.map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={`block w-full truncate rounded-md px-2 py-1.5 text-left text-[12px] ${
                    selectedKey === key ? 'bg-gold text-[#1a1205]' : 'text-parchment/75 hover:bg-white/10'
                  }`}
                >
                  {key.slice(group.length + 1) || key}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col">
          <div className="relative flex-1 bg-[#0a0f1e]">
            {selected && (
              <Canvas key={selectedKey} camera={{ fov: 42, position: [2.4, 1.8, 2.8] }} shadows>
                <ambientLight intensity={0.6} />
                <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow />
                <Bounds fit clip observe margin={2.4}>
                  <Center>
                    <ModelLoader src={selected.path} fallback={<PreviewPlaceholder />} />
                  </Center>
                </Bounds>
                <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
              </Canvas>
            )}
          </div>
          <div className="border-t border-gold/10 bg-black/25 px-4 py-3 text-[11px] text-parchment/60">
            <div className="flex items-center gap-2 font-semibold text-parchment">
              <FiBox className="h-3.5 w-3.5 text-gold" /> {selectedKey}
            </div>
            <div className="mt-1 truncate">
              Ruta: <span className="text-parchment/40">{selected?.path}</span>
            </div>
            <div className="mt-1">
              Fallback procedural: <span className="text-parchment/40">{selected?.fallback}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
})
