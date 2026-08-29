"use client"

import { useEffect, useState } from "react"

type Coin = {
  symbol: string
  name: string
  color: string
  price: number
  change: number
}

// Valores iniciais (fallback) — substituídos por dados reais da Coinbase quando disponíveis.
const INITIAL_COINS: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A", price: 64973.78, change: 1.47 },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA", price: 1926.81, change: 2.96 },
  { symbol: "SOL", name: "Solana", color: "#14F195", price: 77.3, change: 0.1 },
  { symbol: "XRP", name: "XRP", color: "#23292F", price: 1.11, change: 1.03 },
  { symbol: "ADA", name: "Cardano", color: "#0033AD", price: 0.16, change: 0.12 },
  { symbol: "DOGE", name: "Dogecoin", color: "#C2A633", price: 0.13, change: 0.87 },
  { symbol: "LTC", name: "Litecoin", color: "#345D9D", price: 84.22, change: 0.54 },
  { symbol: "USDT", name: "Tether", color: "#26A17B", price: 1.0, change: 0.02 },
]

function formatPrice(value: number) {
  if (value >= 1000) return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (value >= 1) return value.toFixed(2)
  return value.toFixed(4)
}

export function CryptoTicker() {
  const [coins, setCoins] = useState<Coin[]>(INITIAL_COINS)

  useEffect(() => {
    let cancelled = false

    async function loadLivePrices() {
      try {
        const results = await Promise.all(
          INITIAL_COINS.map(async (coin) => {
            if (coin.symbol === "USDT") return coin
            try {
              const res = await fetch(`https://api.exchange.coinbase.com/products/${coin.symbol}-USD/stats`, {
                cache: "no-store",
              })
              if (!res.ok) return coin
              const data = await res.json()
              const last = Number(data.last)
              const open = Number(data.open)
              if (!Number.isFinite(last) || !Number.isFinite(open) || open === 0) return coin
              return { ...coin, price: last, change: ((last - open) / open) * 100 }
            } catch {
              return coin
            }
          }),
        )
        if (!cancelled) setCoins(results)
      } catch {
        // mantém os valores de fallback
      }
    }

    loadLivePrices()
    const interval = setInterval(loadLivePrices, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Duplicamos a lista para o loop contínuo do marquee.
  const loop = [...coins, ...coins]

  return (
    <div className="relative w-full overflow-hidden py-2">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[var(--landing-bg)] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[var(--landing-bg)] to-transparent" />

      <div className="flex w-max animate-marquee">
        {loop.map((coin, index) => {
          const up = coin.change >= 0
          return (
            <div
              key={`${coin.symbol}-${index}`}
              className="flex min-w-[230px] items-center gap-3 border-r border-[var(--landing-line)] px-4 py-2"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: coin.color }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] font-bold text-[var(--landing-text)]">{coin.symbol} / USD</p>
                <p className="truncate font-mono text-xs text-[var(--landing-muted)]">${formatPrice(coin.price)}</p>
              </div>
              <span
                className={`shrink-0 font-mono text-[10px] font-bold ${
                  up ? "text-[var(--landing-primary)]" : "text-[var(--landing-danger)]"
                }`}
              >
                {up ? "+" : ""}
                {coin.change.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
