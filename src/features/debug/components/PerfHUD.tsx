/**
 * Debug performance overlay (`ñ` in debug builds): FPS, frame times, JS heap
 * and the renderer's draw/GPU counters, sampled by `PerfProbe`.
 * @module features/debug/components/PerfHUD
 */

import { memo } from 'react'
import { usePerfMonitorVisible, usePerfSample } from '@/features/debug/state/perfMonitor'

/**
 * @param fps - Frames per second
 * @returns Tailwind text color class for that frame rate
 */
function fpsColor(fps: number): string {
  if (fps >= 55) return 'text-[#5cff8a]'
  if (fps >= 30) return 'text-gold-bright'
  return 'text-[#ff6b5c]'
}

/**
 * @param value - Count
 * @returns Compact human-readable count (`12.3k`, `1.2M`)
 */
function compact(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`
  return String(value)
}

/**
 * @returns Monitor panel, or nothing while hidden
 */
export const PerfHUD = memo(function PerfHUD() {
  const visible = usePerfMonitorVisible()
  const sample = usePerfSample()
  if (!visible) return null

  const rows: Array<[string, string]> = sample
    ? [
        ['Frame', `${sample.frameMs.toFixed(1)} ms · peor ${sample.worstFrameMs.toFixed(0)} ms`],
        ['RAM (JS)', sample.heapUsedMb === null ? 'n/d en este navegador' : `${sample.heapUsedMb.toFixed(0)} / ${sample.heapLimitMb?.toFixed(0)} MB`],
        ['Draw calls', compact(sample.drawCalls)],
        ['Triángulos', compact(sample.triangles)],
        ['Geometrías', compact(sample.geometries)],
        ['Texturas', compact(sample.textures)],
        ['Shaders', compact(sample.programs)],
      ]
    : []

  return (
    <div className="pointer-events-none fixed top-24 left-4 z-60 min-w-52 rounded-lg border border-white/10 bg-black/70 px-3 py-2 font-mono text-[11px] text-parchment/80 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] tracking-[0.18em] uppercase text-parchment/45">Rendimiento</span>
        <span className={`text-[18px] font-bold ${sample ? fpsColor(sample.fps) : 'text-parchment/40'}`}>{sample ? `${sample.fps.toFixed(0)} FPS` : '…'}</span>
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-parchment/45">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 text-[9px] text-parchment/30">Ñ — ocultar</div>
    </div>
  )
})