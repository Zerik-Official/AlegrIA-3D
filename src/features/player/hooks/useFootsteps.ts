import { useEffect, useRef } from 'react'

/**
 * Footstep synthesis using Web Audio API (no external files).
 * Uses filtered noise + low thud. Falls back to no-op if AudioContext unavailable.
 * Optionally you can replace with CDN samples:
 *  - Pixabay: https://pixabay.com/sound-effects/search/footsteps/
 *  - Freesound: https://freesound.org/search/?q=footsteps
 *  - Mixkit: https://mixkit.co/free-sound-effects/footsteps/
 *
 * API example (Howler alternative):
 *   new Audio("https://cdn.pixabay.com/audio/2022/03/24/audio_...mp3").play()
 */

export function useFootsteps(enabled: boolean, isMoving: () => boolean, isSprinting: () => boolean) {
  const ctxRef = useRef<AudioContext | null>(null)
  const lastStepRef = useRef(0)
  const stepCountRef = useRef(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Lazy create AudioContext on first user gesture; also try now
    const ensureCtx = () => {
      if (!ctxRef.current) {
        const AC = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext: typeof AudioContext }).AudioContext
          || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AC) {
          ctxRef.current = new AC()
        }
      }
      if (ctxRef.current && ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {})
      }
      return ctxRef.current
    }

    // Resume on any interaction (click/key)
    const onInteract = () => ensureCtx()
    window.addEventListener('click', onInteract, { once: true })
    window.addEventListener('keydown', onInteract, { once: true })

    ensureCtx()

    const playStep = () => {
      const ctx = ensureCtx()
      if (!ctx) return

      const t = ctx.currentTime
      const isSprint = isSprinting()
      const isLeft = stepCountRef.current % 2 === 0
      stepCountRef.current += 1

      // Thud body
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(isLeft ? 88 : 102, t)
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.12)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(380, t)
      oscGain.gain.setValueAtTime(0, t)
      oscGain.gain.linearRampToValueAtTime(isSprint ? 0.42 : 0.28, t + 0.012)
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.22)

      // Noise transient (stone/wood)
      const bufferSize = ctx.sampleRate * 0.08
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(isLeft ? 1100 : 1450, t)
      noiseFilter.Q.setValueAtTime(0.9, t)
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0, t)
      noiseGain.gain.linearRampToValueAtTime(isSprint ? 0.22 : 0.14, t + 0.005)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.09)

      // Master subtle room
      const master = ctx.createGain()
      master.gain.setValueAtTime(0.95, t)

      osc.connect(filter).connect(oscGain).connect(master).connect(ctx.destination)
      noise.connect(noiseFilter).connect(noiseGain).connect(master).connect(ctx.destination)

      osc.start(t)
      osc.stop(t + 0.24)
      noise.start(t)
      noise.stop(t + 0.09)
    }

    const tick = () => {
      if (!isMoving()) return
      const now = performance.now()
      const isSprint = isSprinting()
      const interval = isSprint ? 290 : 430
      if (now - lastStepRef.current > interval) {
        lastStepRef.current = now
        playStep()
      }
    }

    intervalRef.current = window.setInterval(tick, 40)

    return () => {
      window.removeEventListener('click', onInteract)
      window.removeEventListener('keydown', onInteract)
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [enabled, isMoving, isSprinting])
}
