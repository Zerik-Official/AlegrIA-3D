/**
 * In-canvas sampler for the debug performance monitor: measures frame times
 * and reads the renderer's counters twice a second while the monitor is on.
 * @module features/debug/components/PerfProbe
 */

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { publishPerfSample, usePerfMonitorVisible } from '@/features/debug/state/perfMonitor'

/** Seconds per published sample. */
const SAMPLE_WINDOW = 0.5
/** Bytes per megabyte. */
const MB = 1024 * 1024

/** Chromium's non-standard heap numbers on `performance`. */
interface PerformanceMemory {
  usedJSHeapSize: number
  jsHeapSizeLimit: number
}

/**
 * @returns Null (side-effect only)
 */
export function PerfProbe() {
  const visible = usePerfMonitorVisible()
  const { gl } = useThree()
  const windowRef = useRef({ elapsed: 0, frames: 0, worst: 0 })

  useFrame((_, delta) => {
    if (!visible) return
    const w = windowRef.current
    w.elapsed += delta
    w.frames += 1
    w.worst = Math.max(w.worst, delta)
    if (w.elapsed < SAMPLE_WINDOW) return
    const memory = (performance as Performance & { memory?: PerformanceMemory }).memory
    publishPerfSample({
      fps: w.frames / w.elapsed,
      frameMs: (w.elapsed / w.frames) * 1000,
      worstFrameMs: w.worst * 1000,
      heapUsedMb: memory ? memory.usedJSHeapSize / MB : null,
      heapLimitMb: memory ? memory.jsHeapSizeLimit / MB : null,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    })
    w.elapsed = 0
    w.frames = 0
    w.worst = 0
  })

  return null
}