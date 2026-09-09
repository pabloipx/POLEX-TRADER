"use client"

import { useEffect, useState } from "react"
import { Activity, BarChart3, LineChart, Sparkles } from "lucide-react"
import type { RoboAsset } from "./asset-picker"

interface AnalyzingAnimationProps {
  asset: RoboAsset
}

const STAGES = [
  { label: "Coletando cotações do mercado", icon: LineChart },
  { label: "Calculando tendência e volatilidade", icon: Activity },
  { label: "Cruzando indicadores técnicos", icon: BarChart3 },
  { label: "Definindo o melhor ponto de entrada", icon: Sparkles },
]

export function AnalyzingAnimation({ asset }: AnalyzingAnimationProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 900)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="relative w-28 h-28 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-[#22c55e]/15" />
        <div className="absolute inset-0 rounded-full border-4 border-[#22c55e] border-t-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full overflow-hidden ring-2 ring-[#22c55e]/40 bg-black/40">
          <img src={asset.logo || "/placeholder.svg"} alt={asset.name} className="w-full h-full object-cover" />
        </div>
      </div>

      <p className="text-white font-bold text-lg">Analisando {asset.name}</p>
      <p className="text-white/40 text-xs mb-6">Robo Trader Max processando os dados...</p>

      <div className="w-full max-w-sm space-y-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon
          const done = i < stage
          const active = i === stage
          return (
            <div
              key={s.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition ${
                active
                  ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                  : done
                    ? "border-white/5 bg-white/[0.02]"
                    : "border-white/5 bg-transparent opacity-40"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${done || active ? "text-[#22c55e]" : "text-white/40"}`} />
              <span className={`text-sm text-left ${done || active ? "text-white" : "text-white/50"}`}>{s.label}</span>
              {active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              )}
              {done && <span className="ml-auto text-[#22c55e] text-xs">OK</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
