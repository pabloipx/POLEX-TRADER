"use client"

import { useEffect, useMemo, useRef } from "react"

export function HeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const nodes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: 4 + ((index * 37) % 92),
        top: 8 + ((index * 53) % 80),
        delay: -((index * 0.7) % 5),
      })),
    [],
  )

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) return

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY, 700)
        if (gridRef.current) gridRef.current.style.transform = `translate3d(0, ${offset * 0.12}px, 0)`
        if (rootRef.current) rootRef.current.style.opacity = String(Math.max(0, 1 - offset / 900))
      })
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => {
      window.removeEventListener("scroll", update)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--landing-bg)]" />
      <div ref={gridRef} className="landing-chain-grid absolute inset-0 opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--landing-bg)_0%,transparent_35%,transparent_70%,var(--landing-bg)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,var(--landing-bg)_100%)]" />
      {nodes.map((node) => (
        <span
          key={node.id}
          className="landing-chain-node absolute size-1.5 rounded-full border border-[var(--landing-primary)] bg-[var(--landing-bg)]"
          style={{ left: `${node.left}%`, top: `${node.top}%`, animationDelay: `${node.delay}s` }}
        />
      ))}
    </div>
  )
}
