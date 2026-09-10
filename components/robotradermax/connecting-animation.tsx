"use client"

import { useEffect, useState } from "react"
import { Cpu, ShieldCheck, Wifi, Sparkles, Check } from "lucide-react"
import type { RoboAsset } from "./asset-picker"

interface ConnectingAnimationProps {
  asset: RoboAsset
  modelLabel: string
}

const STAGES = [
  { label: "Estabelecendo conexão segura", icon: Wifi },
  { label: "Autenticando com o modelo", icon: ShieldCheck },
  { label: "Carregando núcleo de análise", icon: Cpu },
  { label: "Pronto para operar", icon: Sparkles },
]

export function ConnectingAnimation({ asset, modelLabel }: ConnectingAnimationProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    // ~4s total: 4 etapas a cada ~950ms
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 950)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center py-8 text-center">
      {/* Núcleo com anéis de radar */}
      <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-[#22c55e]/20 animate-ping" />
        <span
          className="absolute inset-3 rounded-full border border-[#22c55e]/25 animate-ping"
          style={{ animationDelay: "0.4s" }}
        />
        <span
          className="absolute inset-6 rounded-full border border-[#22c55e]/30 animate-ping"
          style={{ animationDelay: "0.8s" }}
        />
        <div className="absolute inset-8 rounded-full border-2 border-[#22c55e]/20" />
        <div className="absolute inset-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#22c55e]/40 bg-[#22c55e]/10 shadow-[0_0_30px_rgba(34,197,94,0.35)]">
          <Cpu className="h-7 w-7 text-[#22c55e]" />
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-[#22c55e]">Conectando com a IA</p>
      <p className="mt-1 text-2xl font-bold text-white text-balance">{modelLabel}</p>
      <p className="mt-1 text-xs text-white/40">
        Preparando análise de <span className="text-white/70">{asset.name}</span>
      </p>

      {/* Etapas */}
      <div className="mt-7 w-full max-w-sm space-y-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon
          const done = i < stage
          const active = i === stage
          return (
            <div
              key={s.label}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                active
                  ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                  : done
                    ? "border-white/5 bg-white/[0.02]"
                    : "border-white/5 bg-transparent opacity-40"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${done || active ? "text-[#22c55e]" : "text-white/40"}`} />
              <span className={`text-left text-sm ${done || active ? "text-white" : "text-white/50"}`}>{s.label}</span>
              {active && <span className="ml-auto h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />}
              {done && <Check className="ml-auto h-4 w-4 text-[#22c55e]" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
