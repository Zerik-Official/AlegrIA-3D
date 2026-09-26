/**
 * Frequency analysis of the app's music, for visuals that move to it
 * (equalizers). Audio elements register under a name; the first visual that
 * asks for one routes it through a Web Audio `AnalyserNode` (and on to the
 * speakers), once per element, for the rest of the session.
 * @module shared/audio/audioAnalyser
 */

/** Music sources visuals can follow. */
export type AudioSourceName = 'phase' | 'carnival'

/** One analysed source. */
interface AnalysedSource {
  analyser: AnalyserNode
  bins: Uint8Array<ArrayBuffer>
}

let context: AudioContext | null = null
const elements = new Map<AudioSourceName, HTMLMediaElement>()
const analysed = new WeakMap<HTMLMediaElement, AnalysedSource>()

/**
 * Makes an audio element available to visuals under `name`.
 * @param name - Source name
 * @param element - The playing element
 */
export function registerAudioSource(name: AudioSourceName, element: HTMLMediaElement): void {
  elements.set(name, element)
}

/**
 * @param name - Source name
 * @returns The source's analyser, created on first request, or `null` when nothing is registered or Web Audio is unavailable
 */
function getSource(name: AudioSourceName): AnalysedSource | null {
  const element = elements.get(name)
  if (!element || typeof AudioContext === 'undefined') return null
  const existing = analysed.get(element)
  if (existing) return existing
  context ??= new AudioContext()
  if (context.state === 'suspended') context.resume().catch(() => {})
  try {
    const node = context.createMediaElementSource(element)
    const analyser = context.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.72
    node.connect(analyser)
    analyser.connect(context.destination)
    const source = { analyser, bins: new Uint8Array(analyser.frequencyBinCount) }
    analysed.set(element, source)
    return source
  } catch {
    return null
  }
}

/** Running loudness reference per band set, so quiet (distant, low-volume) music still fills the bars. */
const peaks = new WeakMap<Float32Array, number>()

/**
 * Fills `levels` with the source's current loudness in `levels.length`
 * log-spaced bands, each `[0, 1]`, auto-gained against the recent peak.
 * @param name - Source name
 * @param levels - Output bands, overwritten in place
 * @returns Whether real audio data was read (`false` means silence or no analyser, so callers can animate on their own)
 */
export function readAudioLevels(name: AudioSourceName, levels: Float32Array): boolean {
  const source = getSource(name)
  const element = elements.get(name)
  if (!source || !element || element.paused) return false
  source.analyser.getByteFrequencyData(source.bins)
  const bins = source.bins.length
  let loudest = 0
  for (let b = 0; b < levels.length; b++) {
    const from = Math.floor(Math.pow(bins * 0.8, b / levels.length))
    const to = Math.max(from + 1, Math.floor(Math.pow(bins * 0.8, (b + 1) / levels.length)))
    let sum = 0
    for (let i = from; i < to; i++) sum += source.bins[i]
    levels[b] = sum / (to - from) / 255
    loudest = Math.max(loudest, levels[b])
  }
  if (loudest < 0.01) return false
  const peak = Math.max(loudest, (peaks.get(levels) ?? loudest) * 0.995)
  peaks.set(levels, peak)
  for (let b = 0; b < levels.length; b++) levels[b] = Math.min(1, levels[b] / peak)
  return true
}
