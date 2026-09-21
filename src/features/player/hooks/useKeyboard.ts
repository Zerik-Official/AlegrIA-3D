import { useEffect, useRef } from 'react'

export type Keys = {
  w: boolean
  a: boolean
  s: boolean
  d: boolean
  shift: boolean
}

export function useKeyboard() {
  const keys = useRef<Keys>({ w: false, a: false, s: false, d: false, shift: false })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'w') keys.current.w = true
      if (k === 'a') keys.current.a = true
      if (k === 's') keys.current.s = true
      if (k === 'd') keys.current.d = true
      if (k === 'shift') keys.current.shift = true
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'w') keys.current.w = false
      if (k === 'a') keys.current.a = false
      if (k === 's') keys.current.s = false
      if (k === 'd') keys.current.d = false
      if (k === 'shift') keys.current.shift = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return keys
}
