"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

type Candle = {
  open: number
  close: number
  high: number
  low: number
}

function generateCandles(isCall: boolean, count = 32): Candle[] {
  const candles: Candle[] = []
  let price = 100
  // viés de alta para COMPRA, de baixa para VENDA
  const bias = isCall ? 0.55 : -0.55
  for (let i = 0; i < count; i++) {
    const drift = (Math.random() - 0.5) * 2.2 + bias
    const open = price
    const close = Math.max(5, open + drift)
    const high = Math.max(open, close) + Math.random() * 1.1
    const low = Math.min(open, close) - Math.random() * 1.1
    candles.push({ open, close, high, low })
    price = close
  }
  return candles
}

export function SignalChart({ isCall, pair }: { isCall: boolean; pair: string }) {
  const candles = useMemo(() => generateCandles(isCall), [isCall, pair])
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setProgress(t)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [candles])

  const width = 600
  const height = 200
  const padX = 8
  const padY = 16
  const values = candles.flatMap((c) => [c.high, c.low])
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const slot = (width - padX * 2) / candles.length
  const bodyW = Math.max(3, slot * 0.55)

  const y = (v: number) => padY + (height - padY * 2) * (1 - (v - min) / range)

  const green = "#22c55e"
  const red = "#ef4444"
  const accent = isCall ? green : red

  const visibleCount = Math.round(candles.length * progress)

  // Linha que acompanha os fechamentos (guia de tendência)
  const linePath = candles
    .map((c, i) => {
      const cx = padX + slot * i + slot / 2
      return `${i === 0 ? "M" : "L"} ${cx.toFixed(1)} ${y(c.close).toFixed(1)}`
    })
    .join(" ")

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-[#0b1016] p-4"
      style={{ borderColor: isCall ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)" }}
    >
      <div className="pointer-events-none absolute inset-0 rtm-grid opacity-60" />
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-[10px] uppercase tracking-widest">Gráfico do ativo</span>
          <span className="text-white font-semibold text-sm">{pair}</span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-bold ${isCall ? "text-[#22c55e]" : "text-[#EF4444]"}`}
        >
          {isCall ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isCall ? "Tendência de alta" : "Tendência de baixa"}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[180px]"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Gráfico de candles com tendência de ${isCall ? "alta" : "baixa"} para ${pair}`}
        >
          <defs>
            <linearGradient id="rtm-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Área sob a linha de tendência */}
          <path
            d={`${linePath} L ${(padX + slot * (candles.length - 1) + slot / 2).toFixed(1)} ${height - padY} L ${(
              padX +
              slot / 2
            ).toFixed(1)} ${height - padY} Z`}
            fill="url(#rtm-chart-fill)"
            opacity={progress}
          />

          {/* Candles */}
          {candles.slice(0, visibleCount).map((c, i) => {
            const cx = padX + slot * i + slot / 2
            const up = c.close >= c.open
            const color = up ? green : red
            const bodyTop = y(Math.max(c.open, c.close))
            const bodyBottom = y(Math.min(c.open, c.close))
            const bodyH = Math.max(1.5, bodyBottom - bodyTop)
            return (
              <g key={i}>
                <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} opacity={0.75} />
                <rect
                  x={cx - bodyW / 2}
                  y={bodyTop}
                  width={bodyW}
                  height={bodyH}
                  rx={1}
                  fill={color}
                  opacity={0.95}
                />
              </g>
            )
          })}

          {/* Linha de tendência */}
          <path
            d={linePath}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1200}
            strokeDashoffset={1200 * (1 - progress)}
            opacity={0.9}
          />
        </svg>
      </div>
    </div>
  )
}
