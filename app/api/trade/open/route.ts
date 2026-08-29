import { NextResponse } from "next/server"
import { getPriceManager } from "@/lib/price-engine/price-manager"
import { getRealPriceAt } from "@/lib/price-engine/real-quote"
import { isRealSymbol } from "@/lib/price-engine/real-price-store"
import { createClient } from "@/lib/supabase/server"
import { isTimeframeAllowed, timeframesFor, TIMEFRAME_LABELS } from "@/lib/trading/timeframes"

const errorMessages: Record<string, string> = {
  ASSET_DISABLED: "Ativo indisponível para negociação.",
  AMOUNT_OUT_OF_RANGE: "Valor fora dos limites permitidos para este ativo.",
  BALANCE_NOT_FOUND: "Saldo não encontrado.",
  INSUFFICIENT_BALANCE: "Saldo insuficiente.",
  INVALID_AMOUNT: "Valor inválido.",
  INVALID_DIRECTION: "Direção inválida.",
  INVALID_PRICE: "Cotação indisponível.",
  INVALID_TIMEFRAME: "Tempo de expiração inválido.",
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })

    const body = await request.json()
    const symbol = typeof body.symbol === "string" ? body.symbol.trim() : ""
    const direction = body.direction
    const amount = Number(body.amount)
    const timeframe = Number(body.timeframe)
    const isDemo = body.isDemo === true
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : ""

    if (!symbol || !["CALL", "PUT"].includes(direction) || !Number.isFinite(amount) || !Number.isInteger(timeframe) || !idempotencyKey) {
      return NextResponse.json({ error: "Dados da operação inválidos." }, { status: 400 })
    }

    if (!isTimeframeAllowed(symbol, timeframe)) {
      const allowed = timeframesFor(symbol).map((value) => TIMEFRAME_LABELS[value]).join(", ")
      return NextResponse.json({ error: `Tempo indisponível para ${symbol}. Use: ${allowed}.` }, { status: 400 })
    }

    const now = Date.now()
    let entryPrice: number | null
    if (isRealSymbol(symbol)) {
      entryPrice = await getRealPriceAt(symbol, now)
    } else {
      const { data: otcSymbols, error: otcError } = await supabase
        .from("otc_symbols")
        .select("symbol,is_active,base_price,volatility")
        .eq("is_active", true)
      if (otcError || !otcSymbols?.length) {
        return NextResponse.json({ error: "Configuração OTC indisponível." }, { status: 503 })
      }
      const manager = getPriceManager()
      manager.initialize(otcSymbols)
      entryPrice = manager.getPriceAt(symbol, now)
    }

    if (!entryPrice || entryPrice <= 0) {
      return NextResponse.json({ error: "Cotação confiável indisponível. Tente novamente." }, { status: 503 })
    }

    const { data, error } = await supabase.rpc("open_trade_atomic", {
      p_symbol: symbol,
      p_direction: direction,
      p_amount: amount,
      p_timeframe: timeframe,
      p_entry_price: entryPrice,
      p_is_demo: isDemo,
      p_idempotency_key: idempotencyKey,
    })

    if (error) {
      const code = Object.keys(errorMessages).find((key) => error.message.includes(key))
      return NextResponse.json({ error: code ? errorMessages[code] : "Não foi possível abrir a operação." }, { status: 400 })
    }

    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error("[trade/open] Falha ao abrir operação:", error)
    return NextResponse.json({ error: "Erro interno ao abrir a operação." }, { status: 500 })
  }
}
