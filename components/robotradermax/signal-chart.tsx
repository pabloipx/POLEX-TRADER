"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

type Candle = {
  open: number
  close: number
  high: number
  low: number
}

const COUNT = 44
// A cada quantos ticks uma vela "fecha" e uma nova começa (movimento ao vivo).
const TICKS_PER_CANDLE = 6
const TICK_MS = 200

function seedCandles(isCall: boolean): Candle[] {
  const candles: Candle[] = []
  let price = 100
  const bias = isCall ? 0.32 : -0.32
  let momentum = 0
  for (let i = 0; i < COUNT; i++) {
    // volatilidade variável + inércia para um caminho mais orgânico
    const vol = 0.7 + Math.random() * 1.8
    momentum = momentum * 0.6 + (Math.random() - 0.5) * 2 * vol + bias
    const open = price
    const close = Math.max(5, open + momentum)
    const high = Math.max(open, close) + Math.random() * vol
    const low = Math.min(open, close) - Math.random() * vol
    candles.push({ open, close, high, low })
    price = close
  }
  return candles
}

export function SignalChart({ isCall, pair }: { isCall: boolean; pair: string }) {
  const [candles, setCandles] = useState<Candle[]>(() => seedCandles(isCall))
  const formingRef = useRef<Candle | null>(null)
  const tickRef = useRef(0)

  // Reinicia o gráfico quando muda a direção ou o ativo
  useEffect(() => {
    setCandles(seedCandles(isCall))
    formingRef.current = null
    tickRef.current = 0
  }, [isCall, pair])

  // Movimento ao vivo: a última vela oscila tick a tick e "fecha" periodicamente
  useEffect(() => {
    const bias = isCall ? 0.2 : -0.2
    const id = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev
        const arr = prev.slice()
        const last = arr[arr.length - 1]
        let forming = formingRef.current
        if (!forming) {
          forming = { open: last.close, close: last.close, high: last.close, low: last.close }
        }
        const vol = 0.5 + Math.random() * 1.3
        const step = (Math.random() - 0.5) * 2 * vol + bias
        const close = Math.max(5, forming.close + step)
        const next: Candle = {
          open: forming.open,
          close,
          high: Math.max(forming.high, close),
          low: Math.min(forming.low, close),
        }
        formingRef.current = next
        arr[arr.length - 1] = next

        tickRef.current += 1
        if (tickRef.current % TICKS_PER_CANDLE === 0) {
          // fecha a vela atual e inicia uma nova a partir do fechamento
          formingRef.current = null
          arr.push({ open: close, close, high: close, low: close })
          if (arr.length > COUNT) arr.shift()
        }
        return arr
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [isCall])

  const width = 600
  const height = 200
  const padX = 6
  const padY = 16
  const values = candles.flatMap((c) => [c.high, c.low])
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const slot = (width - padX * 2) / COUNT
  const bodyW = Math.max(3, slot * 0.55)

  const y = (v: number) => padY + (height - padY * 2) * (1 - (v - min) / range)

  const green = "#22c55e"
  const red = "#ef4444"
  const accent = isCall ? green : red

  const last = candles[candles.length - 1]
  const lastX = padX + slot * (candles.length - 1) + slot / 2
  const lastY = y(last.close)

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
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: accent }}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          </span>
          <span className="text-white/50 text-[10px] uppercase tracking-widest">Ao vivo</span>
          <span className="text-white font-semibold text-sm">{pair}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${isCall ? "text-[#22c55e]" : "text-[#EF4444]"}`}>
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
          aria-label={`Gráfico de candles ao vivo com tendência de ${isCall ? "alta" : "baixa"} para ${pair}`}
        >
          <defs>
            <linearGradient id="rtm-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Área sob a linha de tendência */}
          <path
            d={`${linePath} L ${lastX.toFixed(1)} ${height - padY} L ${(padX + slot / 2).toFixed(1)} ${height - padY} Z`}
            fill="url(#rtm-chart-fill)"
          />

          {/* Candles */}
          {candles.map((c, i) => {
            const cx = padX + slot * i + slot / 2
            const up = c.close >= c.open
            const color = up ? green : red
            const bodyTop = y(Math.max(c.open, c.close))
            const bodyBottom = y(Math.min(c.open, c.close))
            const bodyH = Math.max(1.5, bodyBottom - bodyTop)
            const isLast = i === candles.length - 1
            return (
              <g key={i} opacity={isLast ? 1 : 0.95}>
                <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} opacity={0.75} />
                <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} rx={1} fill={color} />
              </g>
            )
          })}

          {/* Linha de preço atual */}
          <line
            x1={0}
            x2={width}
            y1={lastY}
            y2={lastY}
            stroke={accent}
            strokeWidth={0.75}
            strokeDasharray="4 4"
            opacity={0.5}
          />

          {/* Linha de tendência */}
          <path
            d={linePath}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />

          {/* Ponto de preço atual pulsante */}
          <circle cx={lastX} cy={lastY} r={5} fill={accent} opacity={0.25}>
            <animate attributeName="r" values="4;9;4" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={lastX} cy={lastY} r={2.6} fill={accent} />
        </svg>
      </div>
    </div>
  )
}
