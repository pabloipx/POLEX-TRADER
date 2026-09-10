"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, ChevronDown, Target, Repeat, Sparkles, Clock, Check } from "lucide-react"
import { TIMEFRAME_LABELS, type Timeframe } from "@/lib/trading/timeframes"

export interface RoboAsset {
  symbol: string
  name: string
  category: string
  payout: number
  logo: string
  market?: "otc" | "open"
}

export type AiModel = "openai" | "gemini" | "claude" | "kimi"
export type Strategy = "tendencia" | "reversao" | "smart"
export type ExpirationPref = Extract<Timeframe, 60 | 300 | 600>

export interface RoboConfig {
  model: AiModel
  strategy: Strategy
  expiration: ExpirationPref
}

interface AssetPickerProps {
  assets: RoboAsset[]
  config: RoboConfig
  onConfigChange: (config: RoboConfig) => void
  onSelect: (asset: RoboAsset) => void
}

const MODEL_OPTIONS: {
  value: AiModel
  label: string
  provider: string
  image: string
  accent: string
  precision: string
}[] = [
  {
    value: "openai",
    label: "OpenAI",
    provider: "GPT Core",
    image: "/robotradermax/agents/openai.png",
    accent: "#22c55e",
    precision: "94.2%",
  },
  {
    value: "gemini",
    label: "Gemini 3.6 Flash",
    provider: "Google DeepMind",
    image: "/robotradermax/agents/gemini.png",
    accent: "#38bdf8",
    precision: "92.8%",
  },
  {
    value: "claude",
    label: "Claude Opus 4.7",
    provider: "Anthropic",
    image: "/robotradermax/agents/claude.png",
    accent: "#fb923c",
    precision: "93.5%",
  },
  {
    value: "kimi",
    label: "Kimi K3",
    provider: "Moonshot AI",
    image: "/robotradermax/agents/kimi.png",
    accent: "#a78bfa",
    precision: "91.6%",
  },
]

export const MODEL_LABELS: Record<AiModel, string> = {
  openai: "OpenAI",
  gemini: "Gemini 3.6 Flash",
  claude: "Claude Opus 4.7",
  kimi: "Kimi K3",
}

export const MODEL_META: Record<AiModel, { image: string; accent: string; provider: string }> = {
  openai: { image: "/robotradermax/agents/openai.png", accent: "#22c55e", provider: "GPT Core" },
  gemini: { image: "/robotradermax/agents/gemini.png", accent: "#38bdf8", provider: "Google DeepMind" },
  claude: { image: "/robotradermax/agents/claude.png", accent: "#fb923c", provider: "Anthropic" },
  kimi: { image: "/robotradermax/agents/kimi.png", accent: "#a78bfa", provider: "Moonshot AI" },
}

const STRATEGY_OPTIONS: { value: Strategy; label: string; icon: typeof Target; desc: string }[] = [
  { value: "tendencia", label: "Tendência", icon: Target, desc: "Segue a força do movimento atual." },
  { value: "reversao", label: "Reversão", icon: Repeat, desc: "Busca pontos de virada do preço." },
  { value: "smart", label: "Inteligente", icon: Sparkles, desc: "A IA escolhe o melhor método por ativo." },
]

const EXPIRATION_OPTIONS: { value: ExpirationPref; label: string }[] = [
  { value: 60, label: TIMEFRAME_LABELS[60] },
  { value: 300, label: TIMEFRAME_LABELS[300] },
  { value: 600, label: TIMEFRAME_LABELS[600] },
]

export function AssetPicker({ assets, config, onConfigChange, onSelect }: AssetPickerProps) {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"otc" | "open">("otc")
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const filtered = useMemo(() => {
    const byMarket = assets.filter((a) => (a.market || "otc") === tab)
    if (!search) return byMarket
    const q = search.toLowerCase()
    return byMarket.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q))
  }, [assets, search, tab])

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
          {/* Modelo de IA */}
          <div>
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-white">Agente de IA</span>
              <span className="text-xs text-white/40">Escolha o agente que vai analisar os ativos.</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {MODEL_OPTIONS.map((o) => {
                const active = config.model === o.value
                return (
                  <button
                    key={o.value}
                    onClick={() => onConfigChange({ ...config, model: o.value })}
                    style={
                      active
                        ? {
                            borderColor: `${o.accent}80`,
                            boxShadow: `0 0 24px ${o.accent}22, inset 0 0 20px ${o.accent}14`,
                          }
                        : undefined
                    }
                    className={`group relative overflow-hidden rounded-xl border p-3 text-left transition ${
                      active ? "bg-white/[0.03]" : "border-white/[0.06] bg-transparent hover:border-white/15"
                    }`}
                  >
                    {/* grade tecnológica de fundo */}
                    <span
                      className="pointer-events-none absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                        backgroundSize: "14px 14px",
                        color: o.accent,
                      }}
                    />
                    {/* varredura ao selecionar */}
                    {active && (
                      <span
                        className="pointer-events-none absolute inset-x-0 top-0 h-px animate-[rtmScan_2.4s_linear_infinite]"
                        style={{ background: `linear-gradient(90deg, transparent, ${o.accent}, transparent)` }}
                      />
                    )}

                    <div className="relative flex items-center gap-3">
                      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                        {active && (
                          <span
                            className="absolute inset-0 rounded-full animate-ping"
                            style={{ border: `1px solid ${o.accent}55` }}
                          />
                        )}
                        <span
                          className="absolute inset-0 rounded-full border transition"
                          style={{ borderColor: active ? `${o.accent}80` : "rgba(255,255,255,0.08)" }}
                        />
                        <img
                          src={o.image || "/placeholder.svg"}
                          alt={`Agente ${o.label}`}
                          className={`h-11 w-11 rounded-full object-cover transition ${active ? "" : "grayscale group-hover:grayscale-0"}`}
                        />
                        {active && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#04120a]"
                            style={{ background: o.accent }}
                          >
                            <Check className="h-2.5 w-2.5 text-[#04120a]" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-sm font-semibold"
                          style={{ color: active ? o.accent : "rgba(255,255,255,0.82)" }}
                        >
                          {o.label}
                        </span>
                        <span className="block text-[11px] text-white/35">{o.provider}</span>
                        <span className="mt-1 flex items-center gap-1">
                          <span
                            className="h-1 w-1 rounded-full"
                            style={{ background: o.accent, boxShadow: `0 0 6px ${o.accent}` }}
                          />
                          <span className="text-[10px] font-medium tabular-nums text-white/45">
                            Precisão {o.precision}
                          </span>
                        </span>
                      </span>
                    </div>
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

        {/* Seletor dropdown minimalista */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex w-full items-center gap-3 rounded-2xl border bg-white/[0.02] px-4 py-4 text-left transition ${
              open ? "border-[#22c55e]/50" : "border-white/[0.06] hover:border-white/15"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-[#22c55e]/10 text-[#22c55e]">
              <Search className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white">Selecione um ativo</span>
              <span className="block text-xs text-white/40">Toque para escolher o par que a IA vai analisar</span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-white/40 transition ${open ? "rotate-180 text-[#22c55e]" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1512] shadow-2xl shadow-black/60">
              {/* Abas de mercado */}
              <div className="flex gap-1 border-b border-white/[0.06] p-2">
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
              <div className="relative p-2">
                <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ativo..."
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 transition focus:border-[#22c55e]/50 focus:outline-none"
                />
              </div>

              {/* Lista de ativos */}
              <div className="max-h-[38vh] divide-y divide-white/[0.05] overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="py-10 text-center text-sm text-white/30">Nenhum ativo encontrado.</p>
                )}
                {filtered.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => {
                      setOpen(false)
                      onSelect(asset)
                    }}
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
                    <Check className="h-4 w-4 shrink-0 text-white/0 transition group-hover:text-[#22c55e]" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
