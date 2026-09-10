"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Zap } from "lucide-react"

interface ExecutionOverlayProps {
  direction: "CALL" | "PUT"
  assetName: string
  amount: number
  accountLabel: string
  onDone: () => void
}

const formatCurrency = (value: number): string =>
  (typeof value === "number" && !isNaN(value) ? value : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

// Alturas dos candles: sobem (CALL) ou descem (PUT) em sequência.
const CANDLE_STEPS = [28, 40, 34, 52, 46, 64, 58, 76]

export function ExecutionOverlay({ direction, assetName, amount, accountLabel, onDone }: ExecutionOverlayProps) {
  const [leaving, setLeaving] = useState(false)
  const isCall = direction === "CALL"
  const color = isCall ? "#22c55e" : "#ef4444"
  const heights = isCall ? CANDLE_STEPS : [...CANDLE_STEPS].reverse()

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 2300)
    const doneTimer = setTimeout(() => onDone(), 2650)
    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#05080c]/95 backdrop-blur-md ${
        leaving ? "rtm-overlay-out" : "rtm-overlay-in"
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Grade de fundo */}
      <div className="pointer-events-none absolute inset-0 rtm-grid opacity-60" />
      {/* Brilho radial na cor da direção */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 45%, ${color}26, transparent 55%)` }}
      />

      <div className="rtm-core-in relative flex flex-col items-center px-6 text-center">
        {/* Núcleo com anéis + seta */}
        <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
          <span
            className="rtm-ring absolute inset-0 rounded-full border-2"
            style={{ borderColor: color }}
          />
          <span
            className="rtm-ring absolute inset-0 rounded-full border-2"
            style={{ borderColor: color, animationDelay: "0.5s" }}
          />
          <span
            className="rtm-ring absolute inset-0 rounded-full border"
            style={{ borderColor: color, animationDelay: "1s" }}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}1f`, boxShadow: `0 0 40px -4px ${color}` }}
          >
            {isCall ? (
              <TrendingUp className="rtm-launch-up h-12 w-12" style={{ color }} strokeWidth={2.5} />
            ) : (
              <TrendingDown className="rtm-launch-down h-12 w-12" style={{ color }} strokeWidth={2.5} />
            )}
          </div>
        </div>

        {/* Candles animados na direção */}
        <div className="mb-6 flex h-20 items-end gap-1.5">
          {heights.map((h, i) => (
            <span
              key={i}
              className="rtm-candle-in w-2.5 rounded-sm"
              style={
                {
                  height: `${h}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 10px -2px ${color}`,
                  animationDelay: `${0.15 + i * 0.06}s`,
                  "--rtm-candle-from": isCall ? "24px" : "-24px",
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Palavra da direção */}
        <div className="rtm-word-in flex items-center gap-3">
          {isCall ? (
            <TrendingUp className="h-8 w-8" style={{ color }} />
          ) : (
            <TrendingDown className="h-8 w-8" style={{ color }} />
          )}
          <span className="text-5xl font-black tracking-wide" style={{ color }}>
            {isCall ? "COMPRA" : "VENDA"}
          </span>
        </div>

        <p className="mt-3 text-sm text-white/60">
          {assetName} · R$ {formatCurrency(amount)} · Conta {accountLabel}
        </p>

        {/* Progresso de envio */}
        <div className="mt-8 w-64">
          <div className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            <Zap className="h-3.5 w-3.5" style={{ color }} />
            Enviando ordem para a corretora
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="rtm-progress h-full rounded-full" style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>
    </div>
  )
}
