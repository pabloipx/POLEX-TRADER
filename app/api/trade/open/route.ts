import { NextResponse } from "next/server"
import { multiAssetEngine } from "@/lib/price-engine/multi-asset-engine"
import { loadActiveManipulations } from "@/lib/price-engine/load-manipulations"
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
      // Mercado real: a cotacao exibida no clique deve marcar a linha; aceitamos quando esta
      // proxima do tick real do servidor (tolerancia estreita, pois e preco de mercado real).
      if (entryPrice && entryPrice > 0 && Number.isFinite(displayedPrice) && displayedPrice > 0) {
        if (Math.abs(displayedPrice - entryPrice) / entryPrice <= 0.005) entryPrice = displayedPrice
      }
    } else {
      const { data: otcSymbols, error: otcError } = await supabase
        .from("otc_symbols")
        .select("symbol,is_active,base_price,volatility")
        .eq("is_active", true)
      if (otcError || !otcSymbols?.length) {
        return NextResponse.json({ error: "Configuração OTC indisponível." }, { status: 503 })
      }
      // Mesma serie do grafico + manipulacao ativa carregada do banco.
      await loadActiveManipulations()
      const reference = multiAssetEngine.getPriceAt(symbol, now)
      entryPrice = reference

      // A LINHA DE ENTRADA precisa cair exatamente sobre o candle que o usuario clicou.
      // O grafico OTC e 100% client-side, deterministico e suavizado (lerp por frame). Entre o
      // clique e a chegada desta requisicao ao servidor o motor ja avancou (latencia de rede +
      // suavizacao), entao o `reference` recalculado aqui quase nunca coincide com o preco que
      // estava na tela — era isso que jogava a linha para fora da area visivel ("nao marca").
      // Por isso a entrada usa o preco exibido no clique, validado para permanecer dentro da
      // banda natural que o proprio motor consegue gerar para o ativo (anti-fraude): um cliente
      // nao consegue forjar um preco fora dessa banda, mas qualquer valor legitimo (que sempre
      // cai dentro dela) e aceito e a linha fica exatamente sobre o candle.
      if (Number.isFinite(displayedPrice) && displayedPrice > 0 && reference > 0) {
        const row = otcSymbols.find(
          (s) => String(s.symbol).replace(/-/g, "_") === symbol.replace(/-/g, "_"),
        )
        const volatility = Number(row?.volatility) || 40
        const bandPct = 0.004 + (volatility / 100) * 0.012
        // Folga = amplitude pico-a-pico da banda (hardCap = +/- bandPct*1.3) + margem p/ drift.
        const maxDeviation = bandPct * 2.6 + 0.002
        if (Math.abs(displayedPrice - reference) / reference <= maxDeviation) {
          entryPrice = displayedPrice
        }
      }
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
