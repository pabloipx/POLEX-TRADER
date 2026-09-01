import { NextResponse } from "next/server"
import { getPriceManager } from "@/lib/price-engine/price-manager"
import { getRealPriceAt } from "@/lib/price-engine/real-quote"
import { isRealSymbol } from "@/lib/price-engine/real-price-store"
import { createClient } from "@/lib/supabase/server"
import { isTimeframeAllowed, timeframesFor, TIMEFRAME_LABELS } from "@/lib/trading/timeframes"
import { verifyQuoteProof } from "@/lib/price-engine/quote-proof"
import { injectFault } from "@/lib/testing/fault-injection"

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
    const displayedPrice = Number(body.displayedPrice)
    const verifiedQuote = verifyQuoteProof(body.quoteProof, symbol)
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
    if (isDemo) await injectFault("quote")
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

    // Em serverless, a chamada da entrada pode cair em outra instância daquela que buscou a
    // cotação do gráfico. Se as fontes bloquearem essa segunda chamada, usamos o comprovante
    // HMAC recém-assinado pelo próprio endpoint de mercado — nunca um preço livre do cliente.
    if ((!entryPrice || entryPrice <= 0) && verifiedQuote) {
      entryPrice = verifiedQuote.price
    }

    if (!entryPrice || entryPrice <= 0) {
      return NextResponse.json({ error: "Cotação confiável indisponível. Aguarde a atualização do gráfico." }, { status: 503 })
    }

    // A linha deve marcar exatamente a cotação que estava visível no gráfico no clique.
    // Aceitamos essa cotação somente quando ela permanece próxima da referência autoritativa
    // do servidor, impedindo que o cliente envie um preço arbitrário.
    if (Number.isFinite(displayedPrice) && displayedPrice > 0) {
      const deviation = Math.abs(displayedPrice - entryPrice) / entryPrice
      if (deviation <= 0.005) entryPrice = displayedPrice
    }

    if (isDemo) await injectFault("database-before")
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

    if (isDemo) await injectFault("database-after")
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("RESILIENCE_FAULT:")) {
      return NextResponse.json({ error: "Dependência temporariamente indisponível." }, { status: 503 })
    }
    console.error("[trade/open] Falha ao abrir operação:", error)
    return NextResponse.json({ error: "Erro interno ao abrir a operação." }, { status: 500 })
  }
}
