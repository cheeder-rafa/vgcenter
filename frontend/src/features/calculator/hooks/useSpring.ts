import { useEffect, useRef, useState } from 'react'

type SpringConfig = {
  stiffness?: number
  damping?: number
  mass?: number
  precision?: number
}

export function useSpring(
  target: number,
  {
    stiffness = 280,
    damping = 28,
    mass = 1,
    precision = 0.01,
  }: SpringConfig = {},
): number {
  const [value, setValue] = useState(target)
  const state = useRef({ pos: target, vel: 0, target, rafId: 0, lastTime: 0 })

  useEffect(() => {
    state.current.target = target

    function step(now: number) {
      const s = state.current
      const dt = Math.min((now - s.lastTime) / 1000, 0.064)
      s.lastTime = now

      const force = -stiffness * (s.pos - s.target) - damping * s.vel
      s.vel += (force / mass) * dt
      s.pos += s.vel * dt

      const settled =
        Math.abs(s.pos - s.target) < precision && Math.abs(s.vel) < precision
      if (settled) {
        s.pos = s.target
        s.vel = 0
        setValue(s.pos)
        return
      }

      setValue(s.pos)
      s.rafId = requestAnimationFrame(step)
    }

    cancelAnimationFrame(state.current.rafId)
    state.current.lastTime = performance.now()
    state.current.rafId = requestAnimationFrame(step)

    const s = state.current
    return () => cancelAnimationFrame(s.rafId)
  }, [target, stiffness, damping, mass, precision])

  return value
}
