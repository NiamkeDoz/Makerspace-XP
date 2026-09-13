import { useEffect, useState } from 'react'

interface UseCountUpOptions {
  duration?: number
  delay?: number
  active: boolean
}

/** Animates from 0 to `target` once `active` flips true, easing out over `duration`ms after `delay`ms. */
export function useCountUp(target: number, { duration = 700, delay = 0, active }: UseCountUpOptions): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) {
      setValue(0)
      return
    }

    let raf = 0
    let startTime: number | null = null

    const startTimeout = setTimeout(() => {
      function tick(now: number) {
        if (startTime === null) startTime = now
        const t = Math.min((now - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(Math.round(eased * target))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(startTimeout)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay, active])

  return value
}
