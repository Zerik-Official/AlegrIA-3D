import { memo, useEffect, useRef } from 'react'

/**
 * Props for {@link RainOnLens}.
 */
interface RainOnLensProps {
  /** Whether it's raining — new drops stop landing when it isn't, and the ones left fade away. */
  active: boolean
}

/** One drop on the lens. */
interface Drop {
  x: number
  y: number
  r: number
  /** Downward speed in px/s once it has started to run. */
  vy: number
  /** Seconds it clings before running (big drops) or before drying (small ones). */
  cling: number
  /** Seconds since it landed. */
  age: number
  /** Whether it's heavy enough to run down the lens. */
  runs: boolean
  /** Fade-in/out alpha. */
  alpha: number
  /** Horizontal wobble phase. */
  wobble: number
}

/** A bead left behind by a running drop. */
interface Bead {
  x: number
  y: number
  r: number
  life: number
}

/** Most drops on the lens at once. */
const MAX_DROPS = 48
/** Drops landing per second at full strength. */
const LAND_RATE = 5
/** Seconds a trail bead takes to dry. */
const BEAD_LIFE = 1.8
/** Overall opacity — present, never in the way. */
const STRENGTH = 0.55

/**
 * Raindrops on the camera's lens while it rains over Phase 1: small beads
 * land and cling, bigger drops gather, then run down the screen leaving a
 * trail of tiny beads that dry up. Drawn as refraction-like glints (a dark
 * rim, a soft body and a bright highlight) on a 2D canvas over the scene,
 * kept faint so it adds atmosphere without hiding anything. Never takes
 * pointer events.
 *
 * @param props - Whether it's raining
 * @returns Full-screen canvas
 */
export const RainOnLens = memo(function RainOnLens({ active }: RainOnLensProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const drops: Drop[] = []
    const beads: Bead[] = []
    let strength = 0
    let landDebt = 0
    let last = performance.now()
    let raf = 0

    const resize = (): void => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const land = (): void => {
      const unit = Math.min(canvas.width, canvas.height) / 900
      const big = Math.random() < 0.3
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.85,
        r: (big ? 4.5 + Math.random() * 3.5 : 1.6 + Math.random() * 2.4) * unit,
        vy: 0,
        cling: big ? 0.6 + Math.random() * 2.2 : 3 + Math.random() * 4,
        age: 0,
        runs: big,
        alpha: 0,
        wobble: Math.random() * Math.PI * 2,
      })
    }

    const drawDrop = (x: number, y: number, r: number, alpha: number): void => {
      const body = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r)
      body.addColorStop(0, `rgba(255,255,255,${0.18 * alpha})`)
      body.addColorStop(0.7, `rgba(200,215,230,${0.08 * alpha})`)
      body.addColorStop(1, `rgba(20,28,36,${0.32 * alpha})`)
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * 1.12, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,255,255,${0.7 * alpha})`
      ctx.beginPath()
      ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.22, r * 0.16, -0.6, 0, Math.PI * 2)
      ctx.fill()
    }

    const tick = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      strength += ((activeRef.current ? 1 : 0) - strength) * Math.min(1, dt * 0.6)

      if (activeRef.current) {
        landDebt += LAND_RATE * strength * dt
        while (landDebt >= 1 && drops.length < MAX_DROPS) {
          land()
          landDebt -= 1
        }
        landDebt = Math.min(landDebt, 1)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = beads.length - 1; i >= 0; i--) {
        const b = beads[i]
        b.life -= dt
        if (b.life <= 0) {
          beads.splice(i, 1)
          continue
        }
        drawDrop(b.x, b.y, b.r, (b.life / BEAD_LIFE) * STRENGTH)
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.age += dt
        const drying = !d.runs && d.age > d.cling
        const target = drying || !activeRef.current ? 0 : 1
        d.alpha += (target - d.alpha) * Math.min(1, dt * (target > d.alpha ? 6 : 0.8))
        if (d.runs && d.age > d.cling) {
          d.vy = Math.min(d.vy + 260 * dt, 90 + d.r * 22)
          const prevY = d.y
          d.y += d.vy * dt
          d.x += Math.sin(d.age * 3 + d.wobble) * 0.4
          d.r = Math.max(1.2, d.r - dt * 0.35)
          if (Math.floor(d.y / 14) !== Math.floor(prevY / 14) && Math.random() < 0.8) {
            beads.push({ x: d.x + (Math.random() - 0.5) * d.r * 0.4, y: prevY, r: d.r * (0.25 + Math.random() * 0.2), life: BEAD_LIFE })
          }
        }
        if (d.y - d.r > canvas.height || (d.alpha < 0.01 && d.age > 0.5)) {
          drops.splice(i, 1)
          continue
        }
        drawDrop(d.x, d.y, d.r, d.alpha * STRENGTH)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-6 h-full w-full" />
})