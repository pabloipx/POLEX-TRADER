import { describe, expect, it } from "vitest"
import { PriceManager } from "@/lib/price-engine/price-manager"
import { isTimeframeAllowed, normalizeTimeframe, timeframesFor } from "@/lib/trading/timeframes"

const otcSymbol = {
  id: "test-symbol",
  symbol: "EURUSD_OTC",
  name: "EUR/USD OTC",
  category: "forex",
  base_price: 1.085,
  volatility: 0.0008,
  payout_percentage: 96,
  min_trade_amount: 1,
  max_trade_amount: 10_000,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

describe("PriceManager", () => {
  it("gera o mesmo preço para o mesmo símbolo e instante", () => {
    const manager = new PriceManager()
    manager.initialize([otcSymbol])
    const timestamp = Date.UTC(2026, 0, 1, 12)

    expect(manager.getPriceAt(otcSymbol.symbol, timestamp)).toBe(
      manager.getPriceAt(otcSymbol.symbol, timestamp),
    )
  })

  it("recusa símbolos não inicializados e timestamps inválidos", () => {
    const manager = new PriceManager()
    manager.initialize([otcSymbol])

    expect(manager.getPriceAt("UNKNOWN_OTC", Date.now())).toBeNull()
    expect(manager.getPriceAt(otcSymbol.symbol, Number.NaN)).toBeNull()
  })

  it("mantém o preço dentro do limite de 0,8% do preço-base", () => {
    const manager = new PriceManager()
    manager.initialize([otcSymbol])
    const maxDeviation = otcSymbol.base_price * 0.008

    for (let second = 0; second < 3_600; second += 17) {
      const price = manager.getPriceAt(otcSymbol.symbol, Date.UTC(2026, 0, 1) + second * 1_000)
      expect(price).not.toBeNull()
      expect(price!).toBeGreaterThanOrEqual(otcSymbol.base_price - maxDeviation)
      expect(price!).toBeLessThanOrEqual(otcSymbol.base_price + maxDeviation)
    }
  })
})

describe("regras de timeframe", () => {
  it("permite 1m apenas para OTC e normaliza para 5m no mercado real", () => {
    expect(timeframesFor("EURUSD_OTC")).toEqual([60, 300, 600])
    expect(isTimeframeAllowed("EURUSD_OTC", 60)).toBe(true)
    expect(isTimeframeAllowed("EURUSD", 60)).toBe(false)
    expect(normalizeTimeframe("EURUSD", 60)).toBe(300)
  })

  it("preserva timeframes válidos compartilhados", () => {
    expect(normalizeTimeframe("EURUSD_OTC", 600)).toBe(600)
    expect(normalizeTimeframe("EURUSD", 600)).toBe(600)
  })
})
