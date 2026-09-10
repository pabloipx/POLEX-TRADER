"use client"

import { useMemo, useState } from "react"
import { Search, ChevronRight, Shield, Gauge, Zap, Target, Repeat, Sparkles, Clock } from "lucide-react"
import { TIMEFRAME_LABELS, type Timeframe } from "@/lib/trading/timeframes"

export interface RoboAsset {
  symbol: string
  name: string
  category: string
  payout: number
  logo: string
  market?: "otc" | "open"
}

export type RiskLevel = "conservador" | "moderado" | "agressivo"
export type Strategy = "tendencia" | "reversao" | "smart"
export type ExpirationPref = "auto" | Timeframe

export interface RoboConfig {
  risk: RiskLevel
  strategy: Strategy
  expiration: ExpirationPref
}

interface AssetPickerProps {
  assets: RoboAsset[]
  config: RoboConfig
  onConfigChange: (config: RoboConfig) => void
  onSelect: (asset: RoboAsset) => void
}

const RISK_OPTIONS: { value: RiskLevel; label: string; icon: typeof Shield; desc: string }[] = [
  { value: "conservador", label: "Conservador", icon: Shield, desc: "Entradas de maior confiança, menos sinais." },
  { value: "moderado", label: "Moderado", icon: Gauge, desc: "Equilíbrio entre frequência e precisão." },
  { value: "agressivo", label: "Agressivo", icon: Zap, desc: "Mais sinais, tolera maior volatilidade." },
]

const STRATEGY_OPTIONS: { value: Strategy; label: string; icon: typeof Target; desc: string }[] = [
  { value: "tendencia", label: "Tendência", icon: Target, desc: "Segue a força do movimento atual." },
  { value: "reversao", label: "Reversão", icon: Repeat, desc: "Busca pontos de virada do preço." },
  { value: "smart", label: "Inteligente", icon: Sparkles, desc: "A IA escolhe o melhor método por ativo." },
]

const EXPIRATION_OPTIONS: { value: ExpirationPref; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: 60, label: TIMEFRAME_LABELS[60] },
  { value: 300, label: TIMEFRAME_LABELS[300] },
  { value: 600, label: TIMEFRAME_LABELS[600] },
  { value: 900, label: TIMEFRAME_LABELS[900] },
]

export function AssetPicker({ assets, config, onConfigChange, onSelect }: AssetPickerProps) {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"otc" | "open">("otc")

  const filtered = useMemo(() => {
    const byMarket = assets.filter((a) => (a.market || "otc") === tab)
    if (!search) return byMarket
    const q = search.toLowerCase()
    return byMarket.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q))
  }, [assets, search, tab])

  const riskDesc = RISK_OPTIONS.find((o) => o.value === config.risk)?.desc
  const strategyDesc = STRATEGY_OPTIONS.find((o) => o.value === config.strategy)?.desc

  return (
    <div className="w-full space-y-8">
      {/* Configurações da IA */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-[#22c55e]" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/70">Configurações da IA</h2>
        </div>

        <div className="space-y-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          {/* Nível de risco */}
          <div>
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-white">Nível de risco</span>
              <span className="text-xs text-white/40">{riskDesc}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {RISK_OPTIONS.map((o) => {
                const active = config.risk === o.value
                const Icon = o.icon
                return (
                  <button
                    key={o.value}
                    onClick={() => onConfigChange({ ...config, risk: o.value })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                      active
                        ? "border-[#22c55e]/60 bg-[#22c55e]/10 text-[#22c55e]"
                        : "border-white/[0.06] bg-transparent text-white/50 hover:border-white/15 hover:text-white/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Estratégia */}
          <div>
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-white">Estratégia</span>
              <span className="text-xs text-white/40">{strategyDesc}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STRATEGY_OPTIONS.map((o) => {
                const active = config.strategy === o.value
                const Icon = o.icon
                return (
                  <button
                    key={o.value}
                    onClick={() => onConfigChange({ ...config, strategy: o.value })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                      active
                        ? "border-[#22c55e]/60 bg-[#22c55e]/10 text-[#22c55e]"
                        : "border-white/[0.06] bg-transparent text-white/50 hover:border-white/15 hover:text-white/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tempo de expiração */}
          <div>
            <div className="mb-2.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-white/40" />
              <span className="text-sm font-medium text-white">Tempo de expiração</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXPIRATION_OPTIONS.map((o) => {
                const active = config.expiration === o.value
                return (
                  <button
                    key={String(o.value)}
                    onClick={() => onConfigChange({ ...config, expiration: o.value })}
                    className={`min-w-[3.5rem] rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-[#22c55e]/60 bg-[#22c55e]/10 text-[#22c55e]"
                        : "border-white/[0.06] bg-transparent text-white/50 hover:border-white/15 hover:text-white/80"
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-white/30">
              No modo <span className="text-white/50">Auto</span>, a IA define a melhor expiração para cada ativo.
            </p>
          </div>
        </div>
      </section>

      {/* Seleção de ativo */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-[#22c55e]" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/70">Escolha o ativo</h2>
        </div>

        {/* Abas de mercado */}
        <div className="mb-4 inline-flex w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          <button
            onClick={() => setTab("otc")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === "otc" ? "bg-[#22c55e] text-[#04120a]" : "text-white/50 hover:text-white/80"
            }`}
          >
            OTC
          </button>
          <button
            onClick={() => setTab("open")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === "open" ? "bg-[#22c55e] text-[#04120a]" : "text-white/50 hover:text-white/80"
            }`}
          >
            Mercado Aberto
          </button>
        </div>

        {/* Busca */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ativo..."
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 transition focus:border-[#22c55e]/50 focus:outline-none"
          />
        </div>

        {/* Lista minimalista de ativos */}
        <div className="max-h-[46vh] divide-y divide-white/[0.05] overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-white/30">Nenhum ativo encontrado.</p>
          )}
          {filtered.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => onSelect(asset)}
              className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
            >
              <img
                src={asset.logo || "/placeholder.svg"}
                alt={asset.name}
                className="h-9 w-9 shrink-0 rounded-full bg-black/40 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{asset.name}</p>
                <p className="text-xs text-white/40">Payout {asset.payout}%</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-[#22c55e]" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
