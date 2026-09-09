"use client"

import { useMemo, useState } from "react"
import { Search, TrendingUp } from "lucide-react"

export interface RoboAsset {
  symbol: string
  name: string
  category: string
  payout: number
  logo: string
  market?: "otc" | "open"
}

interface AssetPickerProps {
  assets: RoboAsset[]
  onSelect: (asset: RoboAsset) => void
}

export function AssetPicker({ assets, onSelect }: AssetPickerProps) {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"otc" | "open">("otc")

  const filtered = useMemo(() => {
    const byMarket = assets.filter((a) => (a.market || "otc") === tab)
    if (!search) return byMarket
    const q = search.toLowerCase()
    return byMarket.filter((a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q))
  }, [assets, search, tab])

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-white text-xl font-bold text-balance">Escolha o ativo para a IA analisar</h2>
        <p className="text-white/50 text-sm mt-1">O Robo Trader Max fará a leitura do mercado e enviará o sinal de entrada.</p>
      </div>

      {/* Abas de mercado */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab("otc")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
            tab === "otc" ? "bg-[#22c55e] text-[#04120a]" : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          OTC
        </button>
        <button
          onClick={() => setTab("open")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
            tab === "open" ? "bg-[#22c55e] text-[#04120a]" : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          Mercado Aberto
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ativo..."
          className="w-full pl-10 pr-4 py-3 bg-[#0f1419] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e] transition text-sm"
        />
      </div>

      {/* Grade de ativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[52vh] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-white/40 text-sm py-8">Nenhum ativo encontrado.</p>
        )}
        {filtered.map((asset) => (
          <button
            key={asset.symbol}
            onClick={() => onSelect(asset)}
            className="group flex items-center gap-3 p-3 rounded-xl bg-[#0f1419] border border-white/10 hover:border-[#22c55e] hover:bg-[#22c55e]/5 transition text-left"
          >
            <img
              src={asset.logo || "/placeholder.svg"}
              alt={asset.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 bg-black/40"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{asset.name}</p>
              <p className="text-[#22c55e] text-xs font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Payout {asset.payout}%
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
