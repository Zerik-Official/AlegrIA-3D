/**
 * Frequency analysis of the app's music, for visuals that move to it
 * (equalizers, reactive stages). Audio elements register under a name; the
 * first visual that asks for one routes it through a Web Audio `AnalyserNode`
 * (and on to the speakers), once per element, for the rest of the session.
 * @module shared/audio/audioAnalyser
 */

/** Music sources visuals can follow. */
export type AudioSourceName = 'phase' | 'carnival'

/** One analysed source. */
interface AnalysedSource {
  analyser: AnalyserNode
  bins: Uint8Array<ArrayBuffer>
  time: Uint8Array<ArrayBuffer>
}

/** Per-frame audio analysis driving reactive visuals. */
export interface AudioAnalysis {
  /** Whether real audio data was read (`false` means silence or no analyser, so callers can animate on their own). */
  live: boolean
  /** Overall volume from time-domain RMS, `[0, 1]`. */
  volume: number
  /** Bass energy (~20–160 Hz), `[0, 1]`. */
  bass: number
  /** Mid energy (~160 Hz–2 kHz, where voices live), `[0, 1]`. */
  mids: number
  /** Treble energy (~2–12 kHz), `[0, 1]`. */
  treble: number
  /** Beat pulse: `1` on a bass onset, decaying towards `0` afterwards. */
  beat: number
}

/** Beat state per source. */
interface BeatState {
  /** Recent raw bass energies, oldest first. */
  history: number[]
  /** Decaying beat pulse. */
  beat: number
  /** When the last onset fired, in milliseconds. */
  lastOnset: number
}

let context: AudioContext | null = null
const elements = new Map<AudioSourceName, HTMLMediaElement>()
const analysed = new WeakMap<HTMLMediaElement, AnalysedSource>()
const beats = new WeakMap<AnalysedSource, BeatState>()

/** Frames of bass history compared against the current energy (~0.7 s at 60 fps). */
const BEAT_HISTORY = 43
/** How much louder than the recent average bass must be to count as an onset. */
const BEAT_THRESHOLD = 1.35
/** Minimum milliseconds between onsets. */
const BEAT_COOLDOWN_MS = 250
/** Per-read decay of the beat pulse. */
const BEAT_DECAY = 0.9

/**
 * Makes an audio element available to visuals under `name`.
 * @param name - Source name
 * @param element - The playing element
 */
export function registerAudioSource(name: AudioSourceName, element: HTMLMediaElement): void {
  elements.set(name, element)
}

/** Loop-wrap listeners per element. */
const loopListeners = new Map<HTMLMediaElement, Set<() => void>>()
/** Playback tracking per element, spotting seamless loop restarts. */
const loopState = new WeakMap<HTMLMediaElement, { lastTime: number; lastFire: number }>()

/**
 * Watches an element for seamless loop restarts and fans them out.
 * @param element - Audio element to watch
 */
function ensureLoopTracking(element: HTMLMediaElement): void {
  if (loopListeners.has(element)) return
  loopListeners.set(element, new Set())
  loopState.set(element, { lastTime: 0, lastFire: 0 })
  element.addEventListener('loadedmetadata', () => {
    loopState.set(element, { lastTime: 0, lastFire: 0 })
  })
  element.addEventListener('timeupdate', () => {
    const listeners = loopListeners.get(element)
    const state = loopState.get(element)
    if (!listeners?.size || !state) return
    const current = element.currentTime
    const wrapped = element.loop && current < 5 && state.lastTime - current > 1 && state.lastTime > 1 && performance.now() - state.lastFire > 5000
    state.lastTime = current
    if (!wrapped) return
    state.lastFire = performance.now()
    listeners.forEach((listener) => listener())
  })
}

/**
 * Subscribes to a looping source restarting (a `loop=true` track wrapping
 * around, where `ended` never fires).
 * @param name - Source name
 * @param listener - Called on every loop restart
 * @returns Unsubscriber
 */
export function onAudioLoop(name: AudioSourceName, listener: () => void): () => void {
  const element = elements.get(name)
  if (!element) return () => {}
  ensureLoopTracking(element)
  loopListeners.get(element)?.add(listener)
  return () => {
    loopListeners.get(element)?.delete(listener)
  }
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
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.72
    node.connect(analyser)
    analyser.connect(context.destination)
    const source = { analyser, bins: new Uint8Array(analyser.frequencyBinCount), time: new Uint8Array(analyser.fftSize) }
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
 * log-spaced bands.
 * @param source - Analysed source with fresh frequency data
 * @param levels - Output bands, overwritten in place with `[0, 1]` auto-gained values
 * @returns Raw pre-gain peak and running gain reference for region normalization
 */
function fillBands(source: AnalysedSource, levels: Float32Array): { loudest: number; peak: number } {
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
  const peak = Math.max(loudest, (peaks.get(levels) ?? loudest) * 0.995)
  peaks.set(levels, peak)
  for (let b = 0; b < levels.length; b++) levels[b] = Math.min(1, levels[b] / peak)
  return { loudest, peak }
}

/**
 * Averages the raw bin energy over a frequency range.
 * @param source - Analysed source with fresh frequency data
 * @param sampleRate - Audio sample rate in Hz
 * @param fromHz - Range start in Hz
 * @param toHz - Range end in Hz
 * @returns Mean energy `[0, 1]`
 */
function regionEnergy(source: AnalysedSource, sampleRate: number, fromHz: number, toHz: number): number {
  const binHz = sampleRate / source.analyser.fftSize
  const from = Math.max(0, Math.floor(fromHz / binHz))
  const to = Math.min(source.bins.length - 1, Math.ceil(toHz / binHz))
  if (to < from) return 0
  let sum = 0
  for (let i = from; i <= to; i++) sum += source.bins[i]
  return sum / (to - from + 1) / 255
}

/**
 * Reads the full per-frame analysis of a source: loudness bands plus
 * volume, bass/mids/treble split and a decaying beat pulse.
 * @param name - Source name
 * @param levels - Output bands, overwritten in place with `[0, 1]` auto-gained values
 * @returns Analysis, or `null` when silent, paused or unanalysable (callers should animate on their own)
 */
export function readAudioAnalysis(name: AudioSourceName, levels: Float32Array): AudioAnalysis | null {
  const source = getSource(name)
  const element = elements.get(name)
  if (!source || !element || element.paused) return null
  source.analyser.getByteFrequencyData(source.bins)
  source.analyser.getByteTimeDomainData(source.time)
  const peak = fillBands(source, levels)
  if (peak.loudest < 0.01) return null
  const sampleRate = context?.sampleRate ?? 44100

  let squares = 0
  for (let i = 0; i < source.time.length; i++) {
    const v = (source.time[i] - 128) / 128
    squares += v * v
  }
  const volume = Math.min(1, Math.sqrt(squares / source.time.length) * 3)

  const bassRaw = regionEnergy(source, sampleRate, 20, 160)
  const bass = Math.min(1, bassRaw / peak.peak)
  const mids = Math.min(1, regionEnergy(source, sampleRate, 160, 2000) / peak.peak)
  const treble = Math.min(1, regionEnergy(source, sampleRate, 2000, 12000) / peak.peak)

  let state = beats.get(source)
  if (!state) {
    state = { history: [], beat: 0, lastOnset: 0 }
    beats.set(source, state)
  }
  state.history.push(bassRaw)
  if (state.history.length > BEAT_HISTORY) state.history.shift()
  const average = state.history.reduce((a, b) => a + b, 0) / state.history.length
  const now = performance.now()
  if (state.history.length > 8 && average > 0 && bassRaw > average * BEAT_THRESHOLD && now - state.lastOnset > BEAT_COOLDOWN_MS) {
    state.beat = 1
    state.lastOnset = now
  } else {
    state.beat *= BEAT_DECAY
  }

  return { live: true, volume, bass, mids, treble, beat: state.beat }
}

/**
 * Fills `levels` with the source's current loudness in `levels.length`
 * log-spaced bands, each `[0, 1]`, auto-gained against the recent peak.
 * @param name - Source name
 * @param levels - Output bands, overwritten in place
 * @returns Whether real audio data was read (`false` means silence or no analyser, so callers can animate on their own)
 */
export function readAudioLevels(name: AudioSourceName, levels: Float32Array): boolean {
  return readAudioAnalysis(name, levels) !== null
}
